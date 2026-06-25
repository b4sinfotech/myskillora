import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay/webhook";
import type { VerifyPaymentRequest, ApiResponse } from "@myskillora/types";

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ bookingId: string }>>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as VerifyPaymentRequest;

    const isValid = verifyRazorpaySignature({
      orderId: body.razorpayOrderId,
      paymentId: body.razorpayPaymentId,
      signature: body.razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Update payment to captured
    await admin
      .from("payments")
      .update({
        razorpay_payment_id: body.razorpayPaymentId,
        razorpay_signature: body.razorpaySignature,
        status: "captured",
      })
      .eq("razorpay_order_id", body.razorpayOrderId);

    // Update booking to confirmed
    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", body.bookingId);

    // Create notification for student
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "booking_confirmed",
      title: "Booking Confirmed!",
      body: "Your session has been booked and payment received. Check your dashboard for details.",
      data: { booking_id: body.bookingId },
    });

    // Trigger booking confirmation email (fire-and-forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/booking-confirmed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: body.bookingId }),
    }).catch(() => null);

    return NextResponse.json({ success: true, data: { bookingId: body.bookingId } });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
