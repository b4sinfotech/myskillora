"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import type { CreateBookingResponse } from "@myskillora/types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

interface Props {
  booking: CreateBookingResponse;
  userName: string;
  userEmail: string;
  onSuccess: () => void;
  onDismiss: () => void;
}

export function RazorpayButton({ booking, userName, userEmail, onSuccess, onDismiss }: Props) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (document.getElementById("razorpay-script")) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => toast({ title: "Failed to load payment gateway", variant: "destructive" });
    document.body.appendChild(script);
  }, []);

  const openCheckout = () => {
    if (!scriptLoaded || !window.Razorpay) {
      toast({ title: "Payment gateway not ready", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }

    setIsOpening(true);

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      amount: booking.amount,
      currency: booking.currency,
      name: "myskillora",
      description: "Session Booking",
      order_id: booking.razorpayOrderId,
      prefill: { name: userName, email: userEmail },
      theme: { color: "#0F172A" },
      handler: (response) => {
        fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            bookingId: booking.bookingId,
          }),
        })
          .then((r) => r.json())
          .then((result) => {
            if (result.success) {
              onSuccess();
            } else {
              toast({ title: "Payment verification failed", description: "Please contact support.", variant: "destructive" });
            }
          })
          .catch(() => {
            toast({ title: "Verification error", description: "Please check your bookings for status.", variant: "destructive" });
          });
      },
      modal: {
        ondismiss: () => {
          setIsOpening(false);
          onDismiss();
        },
      },
    });

    rzp.open();
  };

  return (
    <Button
      variant="amber"
      size="lg"
      className="w-full"
      onClick={openCheckout}
      disabled={!scriptLoaded || isOpening}
    >
      {!scriptLoaded || isOpening ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        "Pay Now"
      )}
    </Button>
  );
}
