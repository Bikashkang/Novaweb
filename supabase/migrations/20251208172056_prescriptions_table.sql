-- Prescriptions table for doctor prescriptions

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id bigint references public.appointments(id) on delete set null,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  observations text,
  medicines jsonb not null default '[]'::jsonb,
  doctor_signature text, -- base64 image data
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists prescriptions_appointment_id_idx on public.prescriptions(appointment_id);
create index if not exists prescriptions_doctor_id_idx on public.prescriptions(doctor_id);
create index if not exists prescriptions_patient_id_idx on public.prescriptions(patient_id);
create index if not exists prescriptions_created_at_idx on public.prescriptions(created_at);

-- Enable RLS
alter table public.prescriptions enable row level security;

-- RLS Policies for prescriptions

-- Doctors can create prescriptions for their appointments
drop policy if exists "Doctors can create prescriptions" on public.prescriptions;
create policy "Doctors can create prescriptions" on public.prescriptions
  for insert with check (
    doctor_id = auth.uid() and
    (
      appointment_id is null or
      exists (
        select 1 from public.appointments a
        where a.id = appointment_id and a.doctor_id = auth.uid()
      )
    )
  );

-- Doctors can read their own prescriptions
drop policy if exists "Doctors can read their prescriptions" on public.prescriptions;
create policy "Doctors can read their prescriptions" on public.prescriptions
  for select using (doctor_id = auth.uid());

-- Doctors can update their own prescriptions
drop policy if exists "Doctors can update their prescriptions" on public.prescriptions;
create policy "Doctors can update their prescriptions" on public.prescriptions
  for update using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

-- Patients can read their own prescriptions
drop policy if exists "Patients can read their prescriptions" on public.prescriptions;
create policy "Patients can read their prescriptions" on public.prescriptions
  for select using (patient_id = auth.uid());

-- Function to update updated_at timestamp
create or replace function public.update_prescriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on prescription updates
drop trigger if exists trg_update_prescriptions_updated_at on public.prescriptions;
create trigger trg_update_prescriptions_updated_at
  before update on public.prescriptions
  for each row
  execute function public.update_prescriptions_updated_at();

