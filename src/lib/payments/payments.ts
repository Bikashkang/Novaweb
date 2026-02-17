import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Get API URL - use environment variable or detect from current host
function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // If running in production and no API URL set, try to infer it
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If on production domain, try common API patterns
    if (hostname.includes("novahdl.com") && !hostname.includes("localhost")) {
      // Try common API subdomain patterns
      return `https://api.${hostname.replace("www.", "")}`;
    }
  }

  // Default to localhost for development
  return "http://localhost:3001";
}

const API_URL = getApiUrl();

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partial_refund";

export type AppointmentWithPayment = {
  id: number;
  patient_id: string;
  doctor_id: string;
  appt_type: string;
  appt_date: string;
  appt_time: string;
  payment_status: PaymentStatus;
  payment_id: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_date: string | null;
  refund_amount: number | null;
  refund_id: string | null;
};

/**
 * Create Razorpay order for an appointment
 */
export async function createPaymentOrder(
  appointmentId: number,
  amount: number
): Promise<{ orderId: string; id?: string; amount: number; currency: string }> {
  const apiUrl = API_URL;

  if (!apiUrl || apiUrl === "http://localhost:3001") {
    console.warn("API_URL not configured. Using default localhost. Make sure API server is running.");
  }

  try {
    const response = await fetch(`${apiUrl}/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointmentId,
        amount,
        currency: "INR",
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to create payment order";
      try {
        const errorData = await response.json();
        // NestJS error format: { statusCode, message, error }
        errorMessage = errorData.message || errorData.error || errorData.error?.message || errorMessage;

        // If still no message, use status text
        if (!errorMessage || errorMessage === "Failed to create payment order") {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Ensure orderId is set (API might return 'id' or 'orderId')
    if (result.id && !result.orderId) {
      result.orderId = result.id;
    }
    if (!result.orderId) {
      throw new Error("Invalid order response: missing orderId");
    }
    return result;
  } catch (error: any) {
    // Handle network errors (CORS, connection refused, etc.)
    const errorMessage = error?.message || String(error);
    if (
      error.name === "TypeError" ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("Network request failed")
    ) {
      const isProduction = typeof window !== "undefined" &&
        !window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1");

      if (isProduction && (!process.env.NEXT_PUBLIC_API_URL || apiUrl === "http://localhost:3001")) {
        throw new Error(
          "Payment API is not configured. Please contact support or check your network connection."
        );
      }

      throw new Error(
        `Cannot connect to payment server at ${apiUrl}. Please ensure the API server is running and accessible.`
      );
    }
    throw error;
  }
}

/**
 * Verify payment after Razorpay checkout
 */
export async function verifyPayment(
  appointmentId: number,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
): Promise<{ success: boolean }> {
  const apiUrl = API_URL;

  try {
    const response = await fetch(`${apiUrl}/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointmentId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to verify payment";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    // Handle network errors (CORS, connection refused, etc.)
    const errorMessage = error?.message || String(error);
    if (
      error.name === "TypeError" ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("Network request failed")
    ) {
      const isProduction = typeof window !== "undefined" &&
        !window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1");

      if (isProduction && (!process.env.NEXT_PUBLIC_API_URL || apiUrl === "http://localhost:3001")) {
        throw new Error(
          "Payment API is not configured. Please contact support or check your network connection."
        );
      }

      throw new Error(
        `Cannot connect to payment server at ${apiUrl}. Please ensure the API server is running and accessible.`
      );
    }
    throw error;
  }
}

/**
 * Get payment status for an appointment
 */
export async function getPaymentStatus(
  appointmentId: number
): Promise<AppointmentWithPayment | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, payment_status, payment_id, payment_amount, payment_currency, payment_date, refund_amount, refund_id"
    )
    .eq("id", appointmentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AppointmentWithPayment;
}

/**
 * Process refund for cancelled appointment
 */
export async function processRefund(
  appointmentId: number,
  reason?: string
): Promise<{ success: boolean; refund_id: string; refund_amount: number }> {
  const response = await fetch(`${API_URL}/payments/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appointmentId,
      reason,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to process refund");
  }

  return response.json();
}
