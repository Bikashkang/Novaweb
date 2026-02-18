"use client";
import { useState, useEffect } from "react";
import { loadRazorpayScript, getRazorpayKeyId } from "@/lib/payments/razorpay";
import { createPaymentOrder, verifyPayment } from "@/lib/payments/payments";
import type { PaymentStatus } from "@/lib/payments/payments";

type PaymentButtonProps = {
  appointmentId: number;
  amount: number; // in paise
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string | undefined) => void;
  disabled?: boolean;
};

export function PaymentButton({
  appointmentId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);

  useEffect(() => {
    loadRazorpayScript()
      .then(() => setScriptLoaded(true))
      .catch((error) => {
        console.error("Failed to load Razorpay:", error);
        onPaymentError?.("Failed to load payment gateway");
      });
  }, [onPaymentError]);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      onPaymentError?.("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);
    onPaymentError?.(undefined); // Clear previous errors

    try {
      // Check if API URL is configured
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
        setLoading(false);
        onPaymentError?.("Payment API not configured. Please set NEXT_PUBLIC_API_URL in environment variables.");
        return;
      }

      // Create order
      const order = await createPaymentOrder(appointmentId, amount);

      // Clear loading state before opening Razorpay (so no spinner shows)
      setLoading(false);
      setRazorpayOpen(true);
      // Clear any previous errors since we're opening Razorpay
      onPaymentError?.(undefined);

      // Initialize Razorpay checkout
      const options = {
        key: getRazorpayKeyId(),
        amount: order.amount,
        currency: order.currency,
        name: "Novadoc",
        description: `Payment for Appointment #${appointmentId}`,
        order_id: order.orderId,
        handler: async function (response: any) {
          // Set loading state for verification
          setLoading(true);
          setRazorpayOpen(false);
          try {
            // Verify payment
            await verifyPayment(
              appointmentId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );

            // Clear loading state before calling success callback
            setLoading(false);

            // Call success callback - let the parent component handle UI updates
            onPaymentSuccess?.();
          } catch (error: any) {
            console.error("Payment verification error:", error);
            setLoading(false);
            setRazorpayOpen(false);
            onPaymentError?.(error.message || "Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          // You can prefill customer details if available
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setRazorpayOpen(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      setLoading(false);
      setRazorpayOpen(false);
      const errorMessage = error.message || "Failed to initiate payment";
      onPaymentError?.(errorMessage);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading || !scriptLoaded}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Processing..." : scriptLoaded ? "Pay Now" : "Loading..."}
    </button>
  );
}
