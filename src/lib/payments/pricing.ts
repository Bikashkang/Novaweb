import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Pricing = {
  id: string;
  appointment_type: "video" | "in_clinic";
  doctor_id: string | null;
  amount: number; // in paise
  currency: string;
  is_active: boolean;
};

/**
 * Get pricing for an appointment type and doctor
 * Returns doctor-specific pricing if available, otherwise default pricing
 */
export async function getPricing(
  appointmentType: "video" | "in_clinic",
  doctorId?: string
): Promise<{ amount: number; currency: string } | null> {
  const supabase = getSupabaseBrowserClient();

  // Try to get doctor-specific pricing first
  if (doctorId) {
    const { data: doctorPricing } = await supabase
      .from("appointment_pricing")
      .select("amount, currency")
      .eq("appointment_type", appointmentType)
      .eq("doctor_id", doctorId)
      .eq("is_active", true)
      .single();

    if (doctorPricing) {
      return {
        amount: doctorPricing.amount,
        currency: doctorPricing.currency,
      };
    }
  }

  // Fall back to default pricing
  const { data: defaultPricing } = await supabase
    .from("appointment_pricing")
    .select("amount, currency")
    .eq("appointment_type", appointmentType)
    .is("doctor_id", null)
    .eq("is_active", true)
    .single();

  if (defaultPricing) {
    return {
      amount: defaultPricing.amount,
      currency: defaultPricing.currency,
    };
  }

  return null;
}

/**
 * Format amount from paise to currency display
 */
export function formatAmount(amountInPaise: number, currency: string = "INR"): string {
  if (currency === "INR") {
    return `₹${(amountInPaise / 100).toFixed(2)}`;
  }
  return `${(amountInPaise / 100).toFixed(2)} ${currency}`;
}
