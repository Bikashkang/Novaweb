"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "@/lib/chat/conversations";
import { isAppointmentTime } from "@/lib/video-calls/calls";

type Row = {
  id: number;
  patient_id: string;
  doctor_identifier: string;
  appt_date: string;
  appt_time: string;
  appt_type: string;
  status: string;
};

type Patient = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export default function DoctorBookingsPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorSlug, setDoctorSlug] = useState<string | null>(null);
  const [patientById, setPatientById] = useState<Record<string, Patient>>({});

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function loadForDoctor() {
      setLoading(true);
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("Not signed in");
        setLoading(false);
        return;
      }
      // keep slug for display, but fetch by doctor_id to avoid recursion
      const { data: prof } = await supabase
        .from("profiles")
        .select("doctor_slug")
        .eq("id", userId)
        .single();
      const slug = prof?.doctor_slug ?? null;
      setDoctorSlug(slug);

      const { data, error } = await supabase
        .from("appointments")
        .select("id, patient_id, doctor_identifier, appt_date, appt_time, appt_type, status")
        .eq("doctor_id", userId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) setError(error.message);
      const appts = (data as Row[]) ?? [];
      setRows(appts);

      const ids = Array.from(new Set(appts.map((a) => a.patient_id)));
      if (ids.length > 0) {
        const { data: pats, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ids);
        if (!active) return;
        if (!pErr && pats) {
          const map: Record<string, Patient> = {};
          for (const p of pats as Patient[]) map[p.id] = p;
          setPatientById(map);
        }
      } else {
        setPatientById({});
      }
      setLoading(false);

      // Subscribe to new appointments and updates
      subscription = supabase
        .channel("appointments:doctor")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "appointments",
            filter: `doctor_id=eq.${userId}`,
          },
          async (payload: any) => {
            const newAppt = payload.new as Row & { id: number };
            if (active) {
              // Reload appointments to get full data and refresh patient list
              const { data: reloadData } = await supabase
                .from("appointments")
                .select("id, patient_id, doctor_identifier, appt_date, appt_time, appt_type, status")
                .eq("doctor_id", userId)
                .order("created_at", { ascending: false });
              if (reloadData) {
                setRows(reloadData as Row[]);
                // Update patient list
                const newIds = Array.from(new Set(reloadData.map((a: Row) => a.patient_id)));
                if (newIds.length > 0) {
                  const { data: pats } = await supabase
                    .from("profiles")
                    .select("id, full_name, phone")
                    .in("id", newIds);
                  if (pats) {
                    const map: Record<string, Patient> = {};
                    for (const p of pats as Patient[]) map[p.id] = p;
                    setPatientById(map);
                  }
                }
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "appointments",
            filter: `doctor_id=eq.${userId}`,
          },
          (payload: any) => {
            const updatedAppt = payload.new as Row & { id: number };
            if (active) {
              setRows((prev) => prev.map((r) => (r.id === updatedAppt.id ? { ...r, ...updatedAppt } : r)));
            }
          }
        )
        .subscribe();
    }
    loadForDoctor();
    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  async function updateStatus(id: number, status: "accepted" | "declined") {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">My Bookings</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <p>Loading...</p>
      </main>
    );
  }

  if (rows.length === 0) {
    const message = doctorSlug ? "No bookings yet." : "No doctor identifier configured for your account.";
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">My Bookings</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <p>{message}</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">My Bookings</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Patient</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2 pr-4">{r.appt_date}</td>
                <td className="py-2 pr-4">{r.appt_time}</td>
                <td className="py-2 pr-4">{r.appt_type === "video" ? "Video" : "In-clinic"}</td>
                <td className="py-2 pr-4">
                  <div>
                    <div>{patientById[r.patient_id]?.full_name || r.patient_id.slice(0, 8) + "…"}</div>
                    {patientById[r.patient_id]?.phone && (
                      <div className="text-xs text-slate-500">{patientById[r.patient_id]?.phone}</div>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-4">{r.status}</td>
                <td className="py-2 pr-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1 text-sm"
                        onClick={() => updateStatus(r.id, "accepted")}
                        disabled={r.status === "accepted"}
                      >
                        Accept
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-sm"
                        onClick={() => updateStatus(r.id, "declined")}
                        disabled={r.status === "declined"}
                      >
                        Decline
                      </button>
                    </div>
                    <button
                      className="text-sm text-blue-600 hover:underline text-left"
                      onClick={async () => {
                        const { data: userData } = await supabase.auth.getUser();
                        const doctorId = userData.user?.id;
                        if (!doctorId || !r.patient_id) {
                          alert("Unable to start conversation");
                          return;
                        }
                        const { data: conv, error: convError } = await findOrCreateConversation(
                          r.patient_id,
                          doctorId,
                          r.id
                        );
                        if (convError || !conv) {
                          alert(`Failed to create conversation: ${convError || "Unknown error"}`);
                          return;
                        }
                        router.push(`/chat/${conv.id}`);
                      }}
                    >
                      Message Patient
                    </button>
                    {r.appt_type === "video" && r.status === "accepted" && (
                      <button
                        className={`text-sm text-left font-medium ${
                          isAppointmentTime(r.appt_date, r.appt_time)
                            ? "text-green-600 hover:underline"
                            : "text-slate-400 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (isAppointmentTime(r.appt_date, r.appt_time)) {
                            router.push(`/appointments/${r.id}/video`);
                          } else {
                            alert("Video call is only available 15 minutes before and 45 minutes after the appointment time.");
                          }
                        }}
                        disabled={!isAppointmentTime(r.appt_date, r.appt_time)}
                      >
                        {isAppointmentTime(r.appt_date, r.appt_time)
                          ? "Start Video Call"
                          : "Start Video Call (Not available yet)"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export {};

