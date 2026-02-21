"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sendAppointmentCreatedNotification } from "@/lib/notifications/notifications";
import { getPricing } from "@/lib/payments/pricing";
import { useQuery } from "@tanstack/react-query";
import { DoctorCard } from "@/components/doctor-card";

type AppointmentType = "video" | "in_clinic";

type DoctorProfile = {
  id: string;
  full_name: string | null;
  doctor_slug: string | null;
  speciality: string | null;
  avatar_url?: string | null;
};

function generateTimeOptions(): string[] {
  // Every 15 minutes from 00:00 to 23:45 (24/7)
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
}

function getAvailableTimeSlots(date: string, allTimeOptions: string[]): string[] {
  if (!date) return allTimeOptions;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  if (date === today) {
    const minTime = new Date(now.getTime() + 15 * 60 * 1000);
    const minHour = minTime.getHours();
    const minMinute = minTime.getMinutes();
    let nextSlotMinute: number;
    let nextSlotHour: number;
    if (minMinute <= 15) {
      nextSlotMinute = 15;
      nextSlotHour = minHour;
    } else if (minMinute <= 30) {
      nextSlotMinute = 30;
      nextSlotHour = minHour;
    } else if (minMinute <= 45) {
      nextSlotMinute = 45;
      nextSlotHour = minHour;
    } else {
      nextSlotMinute = 0;
      nextSlotHour = minHour + 1;
    }
    return allTimeOptions.filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      if (hour > nextSlotHour) return true;
      if (hour < nextSlotHour) return false;
      return minute >= nextSlotMinute;
    });
  }
  return allTimeOptions;
}

function DoctorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctorSlug, setSelectedDoctorSlug] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [dateByDoctor, setDateByDoctor] = useState<Record<string, string>>({});
  const [timeByDoctor, setTimeByDoctor] = useState<Record<string, string>>({});
  const [typeByDoctor, setTypeByDoctor] = useState<Record<string, AppointmentType>>({});

  useEffect(() => {
    const doctorSlug = searchParams.get("doctor");
    const doctorId = searchParams.get("doctorId");
    if (doctorSlug) {
      setSelectedDoctorSlug(doctorSlug);
    } else if (doctorId) {
      supabase
        .from("profiles")
        .select("doctor_slug")
        .eq("id", doctorId)
        .single()
        .then(({ data }) => {
          if (data?.doctor_slug) {
            setSelectedDoctorSlug(data.doctor_slug);
          }
        });
    }
  }, [searchParams, supabase]);

  const { data: fetchedDoctors, isLoading, error: queryError } = useQuery({
    queryKey: ["doctors", selectedDoctorSlug],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, doctor_slug, speciality, avatar_url")
        .eq("role", "doctor")
        .not("doctor_slug", "is", null);
      if (selectedDoctorSlug) {
        query = query.eq("doctor_slug", selectedDoctorSlug);
      }
      const { data, error } = await query.order("full_name", { ascending: true, nullsFirst: false });
      if (error) throw new Error(error.message);
      return (data as DoctorProfile[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (fetchedDoctors) {
      setDoctors(fetchedDoctors);
      setLoading(false);
      setError(null);
      if (selectedDoctorSlug && fetchedDoctors.length > 0) {
        setOpenFor(selectedDoctorSlug);
      }
    }
  }, [fetchedDoctors, selectedDoctorSlug]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [queryError]);

  useEffect(() => {
    if (isLoading) setLoading(true);
  }, [isLoading]);

  const allTimeOptions = useMemo(() => generateTimeOptions(), []);

  function onOpen(doctorKey: string) {
    setOpenFor((prev) => (prev === doctorKey ? null : doctorKey));
    const today = new Date().toISOString().slice(0, 10);
    const defaultDate = dateByDoctor[doctorKey] ?? today;
    const availableSlots = getAvailableTimeSlots(defaultDate, allTimeOptions);
    const defaultTime = availableSlots.length > 0 ? availableSlots[0] : "00:00";
    setDateByDoctor((prev) => ({ ...prev, [doctorKey]: defaultDate }));
    setTimeByDoctor((prev) => ({ ...prev, [doctorKey]: prev[doctorKey] && getAvailableTimeSlots(defaultDate, allTimeOptions).includes(prev[doctorKey]) ? prev[doctorKey] : defaultTime }));
    setTypeByDoctor((prev) => ({ ...prev, [doctorKey]: prev[doctorKey] ?? "video" }));
  }

  function handleDateChange(doctorKey: string, newDate: string) {
    setDateByDoctor((prev) => ({ ...prev, [doctorKey]: newDate }));
    const availableSlots = getAvailableTimeSlots(newDate, allTimeOptions);
    const currentTime = timeByDoctor[doctorKey];
    if (!currentTime || !availableSlots.includes(currentTime)) {
      const defaultTime = availableSlots.length > 0 ? availableSlots[0] : "00:00";
      setTimeByDoctor((prev) => ({ ...prev, [doctorKey]: defaultTime }));
    }
  }

  async function onBook(doctor: DoctorProfile) {
    const slug = doctor.doctor_slug;
    if (!slug) return;
    const date = dateByDoctor[slug];
    const time = timeByDoctor[slug];
    const type = typeByDoctor[slug] ?? "video";
    if (!date || !time) return;
    const availableSlots = getAvailableTimeSlots(date, allTimeOptions);
    if (!availableSlots.includes(time)) return;

    const { data: userData } = await supabase.auth.getUser();
    const patientId = userData.user?.id;
    if (!patientId) {
      alert("Please log in to book.");
      return;
    }

    const pricing = await getPricing(type, doctor.id);
    if (!pricing?.amount) return;

    const { data: appointment, error } = await supabase.from("appointments").insert({
      patient_id: patientId,
      doctor_id: doctor.id,
      doctor_identifier: slug,
      appt_date: date,
      appt_time: time,
      appt_type: type,
      payment_status: "pending",
      payment_amount: pricing.amount,
      payment_currency: pricing.currency || "INR"
    }).select().single();

    if (error || !appointment) return;

    (async () => {
      try {
        const [patientAuth, patientProfile, doctorProfile] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from("profiles").select("full_name").eq("id", patientId).single(),
          supabase.from("profiles").select("full_name").eq("id", doctor.id).single(),
        ]);
        const patientEmail = patientAuth.data.user?.email;
        const patientName = patientProfile.data?.full_name || "Patient";
        const doctorName = doctorProfile.data?.full_name || slug;
        if (patientEmail) {
          await sendAppointmentCreatedNotification({
            appointmentId: appointment.id,
            patientId,
            patientEmail,
            patientName,
            doctorId: doctor.id,
            doctorEmail: "",
            doctorName,
            appointmentDate: date,
            appointmentTime: time,
            appointmentType: type,
          });
        }
      } catch (e) { }
    })();

    router.push(`/appointments/${appointment.id}/payment`);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Doctors</h1>
          <p className="text-slate-600">Browse verified doctors and book an appointment.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-slate-100" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500">No doctors available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {doctors.map((doc) => {
              const slug = doc.doctor_slug ?? "";
              const isOpen = openFor === slug;
              const dateVal = slug ? (dateByDoctor[slug] ?? "") : "";
              const timeVal = slug ? (timeByDoctor[slug] ?? "") : "";
              const typeVal = slug ? (typeByDoctor[slug] ?? "video") : "video";
              const disabled = !slug;
              const availableTimeSlots = dateVal ? getAvailableTimeSlots(dateVal, allTimeOptions) : allTimeOptions;

              return (
                <div key={doc.id} className="flex flex-col gap-3">
                  <DoctorCard
                    name={doc.full_name || "Doctor"}
                    specialty={doc.speciality || "General Practitioner"}
                    rating={4.8}
                    distanceLabel="Available"
                    avatarUrl={doc.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name || "Doctor")}&background=2563eb&color=fff&size=128`}
                    onClick={disabled ? undefined : () => slug && onOpen(slug)}
                  />

                  {isOpen && (
                    <div className="rounded-2xl border border-slate-200 p-4 space-y-4 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor={`date-${slug}`}>Date</label>
                          <input
                            id={`date-${slug}`}
                            type="date"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                            value={dateVal}
                            onChange={(e) => handleDateChange(slug, e.target.value)}
                            min={new Date().toISOString().slice(0, 10)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor={`time-${slug}`}>Time</label>
                          {availableTimeSlots.length > 0 ? (
                            <select
                              id={`time-${slug}`}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                              value={timeVal}
                              onChange={(e) => setTimeByDoctor((prev) => ({ ...prev, [slug]: e.target.value }))}
                            >
                              {availableTimeSlots.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full rounded-xl border border-slate-100 px-3 py-2 bg-slate-50 text-slate-400 text-xs">
                              No slots available
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</span>
                          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                            {(['video', 'in_clinic'] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setTypeByDoctor((prev) => ({ ...prev, [slug]: t }))}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${typeVal === t
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                  }`}
                              >
                                {t === 'video' ? 'Video' : 'In-clinic'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          onClick={() => setOpenFor(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                          onClick={() => onBook(doc)}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto p-6 font-sans">
        <h1 className="text-2xl font-semibold mb-2">Find Doctors</h1>
        <p className="text-slate-600 mb-6 font-sans">Loading...</p>
      </main>
    }>
      <DoctorsPageContent />
    </Suspense>
  );
}
