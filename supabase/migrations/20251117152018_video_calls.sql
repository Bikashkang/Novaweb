-- Video calls table for Daily.co integration

create table if not exists public.video_calls (
  id uuid primary key default gen_random_uuid(),
  appointment_id bigint not null unique references public.appointments(id) on delete cascade,
  room_name text not null unique,
  room_url text not null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'ended')),
  doctor_joined_at timestamptz,
  patient_joined_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Add video_call_id to appointments table
alter table public.appointments add column if not exists video_call_id uuid references public.video_calls(id) on delete set null;

-- Indexes
create index if not exists video_calls_appointment_id_idx on public.video_calls(appointment_id);
create index if not exists video_calls_status_idx on public.video_calls(status);
create index if not exists video_calls_room_name_idx on public.video_calls(room_name);

-- Enable RLS
alter table public.video_calls enable row level security;

-- RLS Policies for video_calls
-- Patients can read video calls for their appointments
drop policy if exists "Patients can read own video calls" on public.video_calls;
create policy "Patients can read own video calls" on public.video_calls
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.patient_id = auth.uid()
    )
  );

-- Doctors can read video calls for their appointments
drop policy if exists "Doctors can read own video calls" on public.video_calls;
create policy "Doctors can read own video calls" on public.video_calls
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.doctor_id = auth.uid()
    )
  );

-- Doctors can update video calls (admit patients, update status)
drop policy if exists "Doctors can update video calls" on public.video_calls;
create policy "Doctors can update video calls" on public.video_calls
  for update using (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.doctor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.doctor_id = auth.uid()
    )
  );

-- Patients can update their joined_at timestamp
drop policy if exists "Patients can update own join time" on public.video_calls;
create policy "Patients can update own join time" on public.video_calls
  for update using (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.patient_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = video_calls.appointment_id
        and a.patient_id = auth.uid()
    )
  );

