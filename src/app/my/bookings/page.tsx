"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "@/lib/chat/conversations";
import { isAppointmentTime } from "@/lib/video-calls/calls";

type Row = {
  id: number;
  doctor_id: string;
  doctor_identifier: string;
  appt_date: string;
  appt_time: string;
  appt_type: string;
  status: string;
  created_at?: string;
};

export default function MyBookingsPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("Not signed in");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("appointments")
        .select("id, doctor_id, doctor_identifier, appt_date, appt_time, appt_type, status, created_at")
        .eq("patient_id", userId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) setError(error.message);
      setRows((data as Row[]) ?? []);
      setLoading(false);

      // realtime status updates for this patient
      subscription = supabase
        .channel("appointments:patient")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "appointments",
            filter: `patient_id=eq.${userId}`
          },
          (payload: any) => {
            const newRow = payload.new as Row & { id: number };
            setRows((prev) => prev.map((r) => (r.id === newRow.id ? { ...r, ...newRow } : r)));
          }
        )
        .subscribe();
    }
    load();
    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">My Appointments</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <p>Loading...</p>
      </main>
    );
  }

  if (rows.length === 0) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">My Appointments</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <p>No appointments yet.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">My Appointments</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Doctor</th>
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
                <td className="py-2 pr-4">{r.doctor_identifier}</td>
                <td className="py-2 pr-4">{r.status}</td>
                <td className="py-2 pr-4">
                  <div className="flex flex-col gap-1">
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={async () => {
                        const { data: userData } = await supabase.auth.getUser();
                        const patientId = userData.user?.id;
                        if (!patientId || !r.doctor_id) {
                          alert("Unable to start conversation");
                          return;
                        }
                        const { data: conv, error: convError } = await findOrCreateConversation(
                          patientId,
                          r.doctor_id,
                          r.id
                        );
                        if (convError || !conv) {
                          alert(`Failed to create conversation: ${convError || "Unknown error"}`);
                          return;
                        }
                        router.push(`/chat/${conv.id}`);
                      }}
                    >
                      Message Doctor
                    </button>
                    {r.appt_type === "video" && r.status === "accepted" && (
                      <button
                        className={`text-sm font-medium ${
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
                          ? "Join Video Call"
                          : "Join Video Call (Not available yet)"}
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




