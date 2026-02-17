"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPaymentStatus } from "@/lib/payments/payments";
import { getPricing, formatAmount } from "@/lib/payments/pricing";
import { PaymentButton } from "@/components/payment/payment-button";
import { PaymentStatusBadge } from "@/components/payment/payment-status";
import type { AppointmentWithPayment } from "@/lib/payments/payments";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = parseInt(params.appointmentId as string);
  const supabase = getSupabaseBrowserClient();
  const [appointment, setAppointment] = useState<AppointmentWithPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{ amount: number; currency: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const loadAppointment = useCallback(async (skipLoadingState = false) => {
    if (!skipLoadingState) {
      setLoading(true);
    }
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      if (!skipLoadingState) {
        setLoading(false);
      }
      router.replace("/auth/sign-in");
      return;
    }

    setCurrentUserId(userId);

    // Load appointment
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, appt_type, appt_date, appt_time, payment_status, payment_amount, payment_currency, refund_amount")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      setError("Appointment not found");
      if (!skipLoadingState) {
        setLoading(false);
      }
      return;
    }

    // Verify ownership
    if (appt.patient_id !== userId) {
      setError("You don't have permission to view this appointment");
      if (!skipLoadingState) {
        setLoading(false);
      }
      return;
    }

    setAppointment(appt as any);

    // Load pricing
    const pricingData = await getPricing(appt.appt_type, appt.doctor_id || undefined);
    setPricing(pricingData);

    if (!skipLoadingState) {
      setLoading(false);
    }
  }, [appointmentId, supabase, router]);

  useEffect(() => {
    let active = true;

    async function load() {
      await loadAppointment();
      if (!active) return;
    }

    load();
    return () => {
      active = false;
    };
  }, [loadAppointment]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !appointment) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Error</h1>
            <p className="text-red-800">{error || "Appointment not found"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Calculate amount to pay - use existing payment_amount or fetch from pricing
  const amountToPay = appointment.payment_amount || pricing?.amount || 0;
  const showPaymentButton = (appointment.payment_status === "pending" || appointment.payment_status === "failed") && amountToPay > 0;
  const currency = appointment.payment_currency || pricing?.currency || "INR";

  // If no pricing found and payment is pending, show error
  if (!pricing && !appointment.payment_amount && appointment.payment_status === "pending") {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Payment</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Pricing Not Configured</h2>
            <p className="text-yellow-800 mb-4">
              Pricing for {appointment.appt_type === "video" ? "Video Consultation" : "In-Clinic"} appointments has not been set up yet.
            </p>
            <p className="text-sm text-yellow-700">
              Please contact support or set up pricing in the admin panel.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Payment</h1>

        <div className="bg-white rounded-lg border p-6 space-y-6">
          {/* Appointment Details */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Appointment Details</h2>
            <div className="text-sm text-slate-600 space-y-1">
              <p>Appointment ID: #{appointment.id}</p>
              <p>Date: {appointment.appt_date}</p>
              <p>Time: {appointment.appt_time}</p>
              <p>Type: {appointment.appt_type === "video" ? "Video Consultation" : "In-Clinic"}</p>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Payment Status</h2>
            <PaymentStatusBadge
              status={appointment.payment_status}
              amount={appointment.payment_amount}
              currency={appointment.payment_currency}
              refundAmount={appointment.refund_amount}
            />
          </div>

          {/* Payment Amount */}
          {amountToPay > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Amount to Pay</h2>
              <p className="text-2xl font-bold text-slate-900">
                {formatAmount(amountToPay, currency)}
              </p>
            </div>
          )}

          {/* Payment Button */}
          {showPaymentButton && (
            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Complete Payment</h2>
              {paymentProcessing ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-slate-600">Verifying payment...</p>
                </div>
              ) : (
                <PaymentButton
                  appointmentId={appointmentId}
                  amount={amountToPay}
                  onPaymentSuccess={async () => {
                    setPaymentProcessing(true);
                    setError(null);

                    try {
                      // Wait a moment for the backend to update the appointment
                      await new Promise(resolve => setTimeout(resolve, 1000));

                      // Reload appointment data to get updated payment status (skip loading state to keep paymentProcessing visible)
                      await loadAppointment(true);

                      // Clear processing state
                      setPaymentProcessing(false);
                    } catch (err: any) {
                      console.error("Error reloading appointment after payment:", err);
                      setPaymentProcessing(false);
                      // Still try to reload the appointment, but show a message
                      try {
                        await loadAppointment(true);
                      } catch (reloadErr) {
                        console.error("Error in reload attempt:", reloadErr);
                      }
                      setError("Payment verified, but there was an error refreshing the page. Please refresh manually.");
                    }
                  }}
                  onPaymentError={(error) => {
                    setPaymentProcessing(false);
                    if (error) {
                      setError(error);
                    }
                  }}
                />
              )}
              {error && !paymentProcessing && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in duration-200">
                  <p className="text-red-800 font-medium mb-1">Payment Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                  <p className="text-red-600 text-xs mt-2">
                    If this persists, please check that the API server is running or contact support.
                  </p>
                </div>
              )}
            </div>
          )}

          {appointment.payment_status === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ Payment completed successfully!</p>
              {appointment.payment_id && (
                <p className="text-green-700 text-sm mt-2">Payment ID: {appointment.payment_id}</p>
              )}
            </div>
          )}

          {appointment.payment_status === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Payment failed. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
