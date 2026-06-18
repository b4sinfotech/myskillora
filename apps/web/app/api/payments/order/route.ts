import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance } from "@/lib/razorpay/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateBookingRequest, CreateBookingResponse, ApiResponse } from "@myskillora/types";
import { calculatePlatformFee, calculateTeacherPayout } from "@myskillora/utils";

export async function POST(request: Request): Promise<NextResponse<ApiResponse<CreateBookingResponse>>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as CreateBookingRequest;

    // Fetch the fee details
    const { data: fee } = await supabase
      .from("teacher_fees")
      .select("*, teacher:teacher_profiles(commission_rate, user_id)")
      .eq("id", body.feeId)
      .single();

    if (!fee) {
      return NextResponse.json({ success: false, error: "Fee not found" }, { status: 404 });
    }

    const teacher = fee.teacher as { commission_rate: number; user_id: string } | null;
    const commissionRate = teacher?.commission_rate ?? 0.20;
    const platformFee = calculatePlatformFee(fee.amount, commissionRate);
    const teacherPayout = calculateTeacherPayout(fee.amount, commissionRate);

    const adminClient = createAdminClient();

    // Create booking
    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .insert({
        student_id: user.id,
        teacher_id: teacher?.user_id ?? "",
        category_id: body.categoryId,
        fee_id: body.feeId,
        session_date: body.sessionDate,
        session_time: body.sessionTime,
        duration_minutes: fee.duration_minutes ?? 60,
        status: "pending",
        amount: fee.amount,
        platform_fee: platformFee,
        teacher_payout: teacherPayout,
        currency: fee.currency,
        notes: body.notes,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
    }

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: fee.amount, // in paise
      currency: fee.currency ?? "INR",
      receipt: booking.id,
      notes: {
        booking_id: booking.id,
        student_id: user.id,
        teacher_id: teacher?.user_id ?? "",
      },
    });

    // Save payment record
    await adminClient.from("payments").insert({
      booking_id: booking.id,
      student_id: user.id,
      teacher_id: teacher?.user_id ?? "",
      razorpay_order_id: order.id,
      amount: fee.amount,
      currency: fee.currency ?? "INR",
      status: "created",
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        razorpayOrderId: order.id,
        amount: fee.amount,
        currency: fee.currency ?? "INR",
      },
    });
  } catch (error) {
    console.error("Payment order error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
