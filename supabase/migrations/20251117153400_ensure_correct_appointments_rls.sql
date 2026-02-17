-- CRITICAL FIX: Ensure only the correct RLS policy exists for doctors
-- There may be conflicting policies from different migrations

-- Drop ALL possible doctor appointment policies (in case of conflicts)
drop policy if exists "Doctor can view their appointments" on public.appointments;
drop policy if exists "Doctors can view their appointments" on public.appointments;
drop policy if exists "Doctor can read their appointments" on public.appointments;

-- Create the CORRECT policy using doctor_id (not doctor_identifier)
-- This is the only policy doctors need to see appointments
create policy "Doctor can view their appointments" on public.appointments
  for select using (doctor_id = auth.uid());

-- Also ensure update policy is correct
drop policy if exists "Doctor can update their appointments" on public.appointments;
drop policy if exists "Doctors can update their appointments" on public.appointments;

create policy "Doctor can update their appointments" on public.appointments
  for update using (doctor_id = auth.uid()) 
  with check (doctor_id = auth.uid());

-- Verify: Check if there are any appointments with NULL doctor_id
-- These won't be visible to doctors due to RLS
do $$
declare
  null_count integer;
begin
  select count(*) into null_count
  from public.appointments
  where doctor_id is null;
  
  if null_count > 0 then
    raise warning 'Found % appointments with NULL doctor_id - these will not be visible to doctors', null_count;
    
    -- Try to backfill them
    update public.appointments a
    set doctor_id = p.id
    from public.profiles p
    where a.doctor_identifier = p.doctor_slug
      and p.role = 'doctor'
      and a.doctor_id is null;
      
    raise notice 'Backfilled appointments with NULL doctor_id';
  end if;
end $$;

