import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createDailyRoom, getDailyToken, deleteDailyRoom } from "@/lib/daily/client";
import { sendVideoCallReadyNotification } from "@/lib/notifications/notifications";

export type VideoCall = {
  id: string;
  appointment_id: number;
  room_name: string;
  room_url: string;
  status: "waiting" | "active" | "ended";
  doctor_joined_at: string | null;
  patient_joined_at: string | null;
  ended_at: string | null;
  created_at: string;
};

/**
 * Check if current time is within appointment window (±15 minutes)
 */
export function isAppointmentTime(appointmentDate: string, appointmentTime: string): boolean {
  const now = new Date();
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);

  // 15 minutes before appointment
  const startWindow = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
  // 45 minutes after appointment (assuming 30-min slot + 15 min buffer)
  const endWindow = new Date(appointmentDateTime.getTime() + 45 * 60 * 1000);

  return now >= startWindow && now <= endWindow;
}

/**
 * Check if user can join the video call
 */
export async function canJoinCall(
  appointmentId: number,
  userId: string
): Promise<{ canJoin: boolean; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  // Get appointment details
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .select("appt_date, appt_time, appt_type, status, patient_id, doctor_id, payment_status")
    .eq("id", appointmentId)
    .single();

  if (apptError || !appointment) {
    return { canJoin: false, error: "Appointment not found" };
  }

  // Check if appointment is video type
  if (appointment.appt_type !== "video") {
    return { canJoin: false, error: "This is not a video appointment" };
  }

  // Check if appointment is accepted
  if (appointment.status !== "accepted") {
    return { canJoin: false, error: "Appointment not accepted yet" };
  }

  // Check payment status for video calls
  if (appointment.appt_type === "video" && appointment.payment_status !== "paid") {
    return { canJoin: false, error: "Payment required before joining video call" };
  }

  // Check if user is patient or doctor
  const isPatient = appointment.patient_id === userId;
  const isDoctor = appointment.doctor_id === userId;
  if (!isPatient && !isDoctor) {
    return { canJoin: false, error: "Unauthorized" };
  }

  // Check if within time window
  if (!isAppointmentTime(appointment.appt_date, appointment.appt_time)) {
    return { canJoin: false, error: "Call is not available at this time" };
  }

  return { canJoin: true, error: null };
}

/**
 * Create a video call for an appointment
 */
export async function createVideoCall(
  appointmentId: number
): Promise<{ call: VideoCall | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  // Check if call already exists
  const { data: existing } = await supabase
    .from("video_calls")
    .select("*")
    .eq("appointment_id", appointmentId)
    .single();

  if (existing) {
    return { call: existing as VideoCall, error: null };
  }

  // Get appointment to calculate expiration and fetch user details
  const { data: appointment } = await supabase
    .from("appointments")
    .select("appt_date, appt_time, patient_id, doctor_id, appt_type")
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { call: null, error: "Appointment not found" };
  }

  // Calculate room expiration (2 hours after appointment time)
  const appointmentDateTime = new Date(`${appointment.appt_date}T${appointment.appt_time}:00`);
  const expirationTime = Math.floor(
    (appointmentDateTime.getTime() + 2 * 60 * 60 * 1000) / 1000
  );

  // Create Daily.co room
  const roomName = `appointment-${appointmentId}-${Date.now()}`;
  const { room, error: roomError } = await createDailyRoom(roomName, expirationTime);

  if (roomError || !room) {
    return { call: null, error: roomError || "Failed to create room" };
  }

  // Create video call record
  const { data: videoCall, error: callError } = await supabase
    .from("video_calls")
    .insert({
      appointment_id: appointmentId,
      room_name: room.name,
      room_url: room.url,
      status: "waiting",
    })
    .select()
    .single();

  if (callError || !videoCall) {
    // Clean up Daily.co room if database insert fails
    await deleteDailyRoom(room.name);
    return { call: null, error: callError?.message || "Failed to create call record" };
  }

  // Update appointment with video_call_id
  await supabase
    .from("appointments")
    .update({ video_call_id: videoCall.id })
    .eq("id", appointmentId);

  // Send email notification
  try {
    // Fetch user names - API will fetch emails server-side
    const [patientProfile, doctorProfile] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", appointment.patient_id).single(),
      supabase.from("profiles").select("full_name").eq("id", appointment.doctor_id).single(),
    ]);

    const patientName = patientProfile.data?.full_name || "Patient";
    const doctorName = doctorProfile.data?.full_name || "Doctor";

    if (room.url) {
      sendVideoCallReadyNotification({
        appointmentId,
        patientId: appointment.patient_id,
        patientEmail: "", // API will fetch this server-side
        patientName,
        doctorId: appointment.doctor_id,
        doctorEmail: "", // API will fetch this server-side
        doctorName,
        appointmentDate: appointment.appt_date,
        appointmentTime: appointment.appt_time,
        roomUrl: room.url,
      }).catch((error) => {
        console.error("Failed to send video call ready notification:", error);
      });
    }
  } catch (error) {
    console.error("Error sending video call notification:", error);
    // Don't fail the video call creation if notification fails
  }

  return { call: videoCall as VideoCall, error: null };
}

/**
 * Get video call for an appointment
 */
export async function getVideoCall(
  appointmentId: number
): Promise<{ call: VideoCall | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("video_calls")
    .select("*")
    .eq("appointment_id", appointmentId)
    .single();

  if (error) {
    return { call: null, error: error.message };
  }

  return { call: (data as VideoCall) || null, error: null };
}

/**
 * Update video call status
 */
export async function updateCallStatus(
  callId: string,
  status: "waiting" | "active" | "ended",
  userId: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  // Get call to verify ownership and get current state
  const { data: call, error: callError } = await supabase
    .from("video_calls")
    .select("appointment_id, doctor_joined_at, patient_joined_at")
    .eq("id", callId)
    .single();

  if (callError || !call) {
    return { error: callError?.message || "Call not found" };
  }

  // Get appointment separately to verify ownership
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .select("doctor_id, patient_id")
    .eq("id", call.appointment_id)
    .single();

  if (apptError || !appointment) {
    return { error: apptError?.message || "Appointment not found" };
  }

  const isDoctor = appointment.doctor_id === userId;
  const isPatient = appointment.patient_id === userId;

  if (!isDoctor && !isPatient) {
    return { error: "Unauthorized" };
  }

  const updateData: any = { status };

  // Set joined_at timestamps
  if (status === "active") {
    if (isDoctor && !call.doctor_joined_at) {
      updateData.doctor_joined_at = new Date().toISOString();
    }
    if (isPatient && !call.patient_joined_at) {
      updateData.patient_joined_at = new Date().toISOString();
    }
  }

  if (status === "ended") {
    updateData.ended_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("video_calls")
    .update(updateData)
    .eq("id", callId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get Daily.co token for joining a call
 */
export async function getCallToken(
  appointmentId: number,
  userId: string
): Promise<{ token: string | null; error: string | null }> {
  const { call, error: callError } = await getVideoCall(appointmentId);
  if (callError || !call) {
    return { token: null, error: callError || "Call not found" };
  }

  // Get appointment to determine if user is doctor
  const supabase = getSupabaseBrowserClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("doctor_id")
    .eq("id", appointmentId)
    .single();

  const isOwner = appointment?.doctor_id === userId;

  const { token, error: tokenError } = await getDailyToken(call.room_name, userId, isOwner);
  return { token, error: tokenError };
}

