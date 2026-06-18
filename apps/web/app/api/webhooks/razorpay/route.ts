import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay/webhook";
import type { RazorpayWebhookEvent } from "@myskillora/types";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body) as RazorpayWebhookEvent;
    const supabase = createAdminClient();

    if (event.event === "payment.captured") {
      const payment = event.payload.payment?.entity;
      if (!payment) return NextResponse.json({ received: true });

      // Update payment record
      const { data: paymentRecord } = await supabase
        .from("payments")
        .update({
          razorpay_payment_id: payment.id,
          status: "captured",
          payment_method: payment.method,
        })
        .eq("razorpay_order_id", payment.order_id)
        .select("booking_id, student_id, teacher_id")
        .single();

      if (paymentRecord) {
        // Confirm the booking
        await supabase
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", paymentRecord.booking_id);

        // Create notifications for both parties
        await supabase.from("notifications").insert([
          {
            user_id: paymentRecord.student_id,
            type: "booking_confirmed",
            title: "Booking Confirmed!",
            body: "Your session has been confirmed. Check your upcoming sessions.",
            data: { booking_id: paymentRecord.booking_id },
          },
          {
            user_id: paymentRecord.teacher_id,
            type: "booking_confirmed",
            title: "New Booking Received!",
            body: "A student has booked a session with you. Check your schedule.",
            data: { booking_id: paymentRecord.booking_id },
          },
        ]);

        // Send confirmation emails via API route
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/booking-confirmed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: paymentRecord.booking_id }),
        });
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment?.entity;
      if (!payment) return NextResponse.json({ received: true });

      await supabase
        .from("payments")
        .update({ status: "failed", razorpay_payment_id: payment.id })
        .eq("razorpay_order_id", payment.order_id);

      // Set booking back to cancelled
      const { data: paymentRecord } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("razorpay_order_id", payment.order_id)
        .single();

      if (paymentRecord) {
        await supabase
          .from("bookings")
          .update({ status: "cancelled", cancellation_reason: "Payment failed" })
          .eq("id", paymentRecord.booking_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
