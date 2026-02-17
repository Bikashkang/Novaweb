-- Add doctor_id to appointments to avoid profiles policy recursion

alter table public.appointments add column if not exists doctor_id uuid;

-- Backfill doctor_id from doctor_identifier -> profiles.doctor_slug
update public.appointments a
set doctor_id = p.id
from public.profiles p
where a.doctor_identifier = p.doctor_slug
  and a.doctor_id is null;

-- Add foreign key (NULLs allowed; use application logic to ensure future inserts set doctor_id)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_doctor_id_fkey') then
    alter table public.appointments add constraint appointments_doctor_id_fkey foreign key (doctor_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Update appointments RLS: use doctor_id instead of joining profiles
drop policy if exists "Doctor can view their appointments" on public.appointments;
create policy "Doctor can view their appointments" on public.appointments
  for select using (doctor_id = auth.uid());

drop policy if exists "Doctor can update their appointments" on public.appointments;
create policy "Doctor can update their appointments" on public.appointments
  for update using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

-- Update profiles policy for doctors to read patient profiles using appointments.doctor_id
drop policy if exists "Doctor can read patient profiles for own appointments" on public.profiles;
create policy "Doctor can read patient profiles for own appointments" on public.profiles
  for select using (
    exists (
      select 1 from public.appointments a
      where a.patient_id = profiles.id and a.doctor_id = auth.uid()
    )
  );


