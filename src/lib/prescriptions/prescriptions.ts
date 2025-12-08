import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type Prescription = {
  id: string;
  appointment_id: number | null;
  doctor_id: string;
  patient_id: string;
  patient_name: string | null;
  patient_age: string | null;
  observations: string | null;
  medicines: Medicine[];
  doctor_signature: string | null;
  created_at: string;
  updated_at: string;
};

export type PrescriptionFormData = {
  appointment_id?: number | null;
  patient_name?: string;
  patient_age?: string;
  observations: string;
  medicines: Medicine[];
  doctor_signature: string | null;
};

/**
 * Create a new prescription
 */
export async function createPrescription(
  appointmentId: number | null,
  doctorId: string,
  patientId: string,
  data: PrescriptionFormData
): Promise<{ prescription: Prescription | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .insert({
      appointment_id: appointmentId,
      doctor_id: doctorId,
      patient_id: patientId,
      patient_name: data.patient_name?.trim() || null,
      patient_age: data.patient_age?.trim() || null,
      observations: data.observations || null,
      medicines: data.medicines,
      doctor_signature: data.doctor_signature || null,
    })
    .select()
    .single();

  if (error) {
    return { prescription: null, error: error.message };
  }

  return { prescription: prescription as Prescription, error: null };
}

/**
 * Get prescription by ID
 */
export async function getPrescription(
  id: string
): Promise<{ prescription: Prescription | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { prescription: null, error: error.message };
  }

  return { prescription: prescription as Prescription, error: null };
}

/**
 * Get prescriptions for a specific appointment
 */
export async function getPrescriptionsByAppointment(
  appointmentId: number
): Promise<{ prescriptions: Prescription[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) {
    return { prescriptions: [], error: error.message };
  }

  return { prescriptions: (prescriptions as Prescription[]) || [], error: null };
}

/**
 * Get all prescriptions for a patient
 */
export async function getPrescriptionsByPatient(
  patientId: string
): Promise<{ prescriptions: Prescription[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    return { prescriptions: [], error: error.message };
  }

  return { prescriptions: (prescriptions as Prescription[]) || [], error: null };
}

/**
 * Get all prescriptions created by a doctor
 */
export async function getPrescriptionsByDoctor(
  doctorId: string
): Promise<{ prescriptions: Prescription[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) {
    return { prescriptions: [], error: error.message };
  }

  return { prescriptions: (prescriptions as Prescription[]) || [], error: null };
}

/**
 * Update an existing prescription
 */
export async function updatePrescription(
  id: string,
  data: Partial<PrescriptionFormData>
): Promise<{ prescription: Prescription | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const updateData: any = {};
  if (data.patient_name !== undefined) updateData.patient_name = data.patient_name?.trim() || null;
  if (data.patient_age !== undefined) updateData.patient_age = data.patient_age?.trim() || null;
  if (data.observations !== undefined) updateData.observations = data.observations || null;
  if (data.medicines !== undefined) updateData.medicines = data.medicines;
  if (data.doctor_signature !== undefined) updateData.doctor_signature = data.doctor_signature || null;

  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { prescription: null, error: error.message };
  }

  return { prescription: prescription as Prescription, error: null };
}

