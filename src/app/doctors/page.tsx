"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AppointmentType = "video" | "in_clinic";

type DoctorProfile = {
  id: string;
  full_name: string | null;
  doctor_slug: string | null;
};

function generateTimeOptions(): string[] {
  // Every 30 minutes from 00:00 to 23:30 (24/7)
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
}

/**
 * Get available time slots for a given date
 * Filters out past time slots if the date is today
 */
function getAvailableTimeSlots(date: string, allTimeOptions: string[]): string[] {
  if (!date) return allTimeOptions;
  
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  
  // If the selected date is today, filter out past time slots
  if (date === today) {
    // Add 30 minutes buffer to current time
    const minTime = new Date(now.getTime() + 30 * 60 * 1000);
    const minHour = minTime.getHours();
    const minMinute = minTime.getMinutes();
    
    // Round up to next 30-minute slot
    const nextSlotMinute = minMinute <= 30 ? 30 : 0;
    const nextSlotHour = minMinute <= 30 ? minHour : minHour + 1;
    
    return allTimeOptions.filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      
      // Compare hours and minutes
      if (hour > nextSlotHour) return true;
      if (hour < nextSlotHour) return false;
      // Same hour, compare minutes
      return minute >= nextSlotMinute;
    });
  }
  
  // For future dates, return all time slots
  return allTimeOptions;
}

export default function DoctorsPage() {
  const supabase = getSupabaseBrowserClient();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, doctor_slug")
        .eq("role", "doctor")
        .order("full_name", { ascending: true, nullsFirst: false });
      if (!active) return;
      if (error) setError(error.message);
      setDoctors((data as DoctorProfile[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [supabase]);

  const allTimeOptions = useMemo(() => generateTimeOptions(), []);
  const [openFor, setOpenFor] = useState<string | null>(null); // key by doctor_slug
  const [dateByDoctor, setDateByDoctor] = useState<Record<string, string>>({});
  const [timeByDoctor, setTimeByDoctor] = useState<Record<string, string>>({});
  const [typeByDoctor, setTypeByDoctor] = useState<Record<string, AppointmentType>>({});

  function onOpen(doctorKey: string) {
    setOpenFor((prev) => (prev === doctorKey ? null : doctorKey));
    // initialize defaults if empty
    const today = new Date().toISOString().slice(0, 10);
    const defaultDate = dateByDoctor[doctorKey] ?? today;
    
    // Get available time slots for the default date
    const availableSlots = getAvailableTimeSlots(defaultDate, allTimeOptions);
    const defaultTime = availableSlots.length > 0 ? availableSlots[0] : "00:00";
    
    setDateByDoctor((prev) => ({ ...prev, [doctorKey]: defaultDate }));
    setTimeByDoctor((prev) => ({ ...prev, [doctorKey]: prev[doctorKey] && getAvailableTimeSlots(defaultDate, allTimeOptions).includes(prev[doctorKey]) ? prev[doctorKey] : defaultTime }));
    setTypeByDoctor((prev) => ({ ...prev, [doctorKey]: prev[doctorKey] ?? "video" }));
  }
  
  function handleDateChange(doctorKey: string, newDate: string) {
    setDateByDoctor((prev) => ({ ...prev, [doctorKey]: newDate }));
    
    // Get available time slots for the new date
    const availableSlots = getAvailableTimeSlots(newDate, allTimeOptions);
    
    // If current time selection is not available, set to first available slot
    const currentTime = timeByDoctor[doctorKey];
    if (!currentTime || !availableSlots.includes(currentTime)) {
      const defaultTime = availableSlots.length > 0 ? availableSlots[0] : "00:00";
      setTimeByDoctor((prev) => ({ ...prev, [doctorKey]: defaultTime }));
    }
  }

  async function onBook(doctor: DoctorProfile) {
    const slug = doctor.doctor_slug;
    if (!slug) {
      alert("This doctor does not have a configured identifier.");
      return;
    }
    const date = dateByDoctor[slug];
    const time = timeByDoctor[slug];
    const type = typeByDoctor[slug] ?? "video";
    if (!date || !time) {
      alert("Please select both date and time.");
      return;
    }
    
    // Validate that the selected time is in the future
    const availableSlots = getAvailableTimeSlots(date, allTimeOptions);
    if (!availableSlots.includes(time)) {
      alert("Please select a future time slot. Past time slots are not available.");
      return;
    }
    
    const doctorIdentifier = slug;
    const { error } = await supabase.from("appointments").insert({
      patient_id: (await supabase.auth.getUser()).data.user?.id,
      doctor_id: doctor.id,
      doctor_identifier: doctorIdentifier,
      appt_date: date,
      appt_time: time,
      appt_type: type
    });
    if (error) {
      alert(`Failed to book: ${error.message}`);
      return;
    }
    const name = doctor.full_name || doctorIdentifier;
    alert(`Booked ${type === "video" ? "video" : "in-clinic"} appointment with ${name} on ${date} at ${time}.`);
    setOpenFor(null);
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Find Doctors</h1>
      <p className="text-slate-600 mb-6">Browse verified doctors and book an appointment.</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : doctors.length === 0 ? (
        <p>No doctors available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => {
            const slug = doc.doctor_slug ?? "";
            const isOpen = openFor === slug;
            const dateVal = slug ? (dateByDoctor[slug] ?? "") : "";
            const timeVal = slug ? (timeByDoctor[slug] ?? "") : "";
            const typeVal = slug ? (typeByDoctor[slug] ?? "video") : "video";
            const disabled = !slug;
            const availableTimeSlots = dateVal ? getAvailableTimeSlots(dateVal, allTimeOptions) : allTimeOptions;
            
            return (
              <div key={slug || doc.id} className="rounded border p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-lg">{doc.full_name || slug || doc.id}</h2>
                    {slug ? (
                      <p className="text-xs text-slate-500">Identifier: {slug}</p>
                    ) : (
                      <p className="text-xs text-amber-700">No identifier set; booking disabled</p>
                    )}
                  </div>
                  <button
                    className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => slug && onOpen(slug)}
                  >
                    {isOpen ? "Close" : "Book"}
                  </button>
                </div>

                {isOpen && (
                  <div className="rounded border p-3 space-y-3 bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-sm" htmlFor={`date-${slug}`}>Date</label>
                        <input
                          id={`date-${slug}`}
                          type="date"
                          className="w-full rounded border px-3 py-2 bg-white text-slate-900"
                          value={dateVal}
                          onChange={(e) => handleDateChange(slug, e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm" htmlFor={`time-${slug}`}>Time</label>
                        {availableTimeSlots.length > 0 ? (
                          <select
                            id={`time-${slug}`}
                            className="w-full rounded border px-3 py-2 bg-white text-slate-900"
                            value={timeVal}
                            onChange={(e) => setTimeByDoctor((prev) => ({ ...prev, [slug]: e.target.value }))}
                          >
                            {availableTimeSlots.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full rounded border px-3 py-2 bg-slate-100 text-slate-500 text-sm">
                            No available slots today
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm">Type</span>
                        <div className="flex gap-3 border rounded p-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`type-${slug}`}
                              value="video"
                              checked={typeVal === "video"}
                              onChange={() => setTypeByDoctor((prev) => ({ ...prev, [slug]: "video" }))}
                            />
                            Video
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`type-${slug}`}
                              value="in_clinic"
                              checked={typeVal === "in_clinic"}
                              onChange={() => setTypeByDoctor((prev) => ({ ...prev, [slug]: "in_clinic" }))}
                            />
                            In-clinic
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded border px-3 py-2 text-sm"
                        onClick={() => setOpenFor(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded bg-black text-white px-3 py-2 text-sm"
                        onClick={() => onBook(doc)}
                      >
                        Confirm booking
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

 


