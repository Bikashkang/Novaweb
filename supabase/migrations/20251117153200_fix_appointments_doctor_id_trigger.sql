-- Fix appointments trigger to ensure doctor_id is ALWAYS set correctly
-- This is critical for RLS policies to work

-- First, ensure we have the correct RLS policy (using doctor_id, not doctor_identifier)
drop policy if exists "Doctor can view their appointments" on public.appointments;
create policy "Doctor can view their appointments" on public.appointments
  for select using (doctor_id = auth.uid());

drop policy if exists "Doctor can update their appointments" on public.appointments;
create policy "Doctor can update their appointments" on public.appointments
  for update using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

-- Drop and recreate the trigger function with better error handling
drop trigger if exists trg_appointments_set_doctor_id on public.appointments;
drop function if exists public.appointments_set_doctor_id();

-- Create improved trigger function that ALWAYS sets doctor_id
-- Uses SECURITY DEFINER to bypass RLS when reading profiles
create or replace function public.appointments_set_doctor_id()
returns trigger as $$
declare
  doctor_uuid uuid;
begin
  -- CRITICAL: Always set doctor_id from doctor_identifier
  -- This must happen for RLS policies to work correctly
  if new.doctor_identifier is not null then
    -- Look up doctor by doctor_slug (bypasses RLS due to SECURITY DEFINER)
    select p.id into doctor_uuid
    from public.profiles p
    where p.doctor_slug = new.doctor_identifier
      and p.role = 'doctor'
    limit 1;
    
    if doctor_uuid is not null then
      new.doctor_id := doctor_uuid;
    elsif new.doctor_id is null then
      -- If we can't find the doctor and doctor_id wasn't provided, log a warning
      -- but allow the insert to proceed (RLS will filter it out)
      raise warning 'Could not find doctor with slug "%" - appointment may not be visible to doctor', new.doctor_identifier;
    end if;
  elsif new.doctor_id is null then
    -- No doctor_identifier provided and no doctor_id - log warning
    raise warning 'Appointment created without doctor_id or doctor_identifier - may not be visible to doctors';
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Grant necessary permissions to the function
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Create trigger that runs BEFORE insert or update
create trigger trg_appointments_set_doctor_id
  before insert or update on public.appointments
  for each row
  execute function public.appointments_set_doctor_id();

-- Backfill any appointments with NULL doctor_id
update public.appointments a
set doctor_id = p.id
from public.profiles p
where a.doctor_identifier = p.doctor_slug
  and p.role = 'doctor'
  and a.doctor_id is null;

