-- Fix RLS policies: Add INSERT policies for video_calls

-- Patients can create video calls for their appointments
drop policy if exists "Patients can create video calls" on public.video_calls;
create policy "Patients can create video calls" on public.video_calls
  for insert with check (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.patient_id = auth.uid()
    )
  );

-- Doctors can create video calls for their appointments
drop policy if exists "Doctors can create video calls" on public.video_calls;
create policy "Doctors can create video calls" on public.video_calls
  for insert with check (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.doctor_id = auth.uid()
    )
  );

