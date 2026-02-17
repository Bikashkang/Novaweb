-- Fix RLS recursion by using a security definer function for doctor-patient checks
-- This prevents the infinite loop when profiles policy checks appointments which checks profiles...

-- 1. Create a secure function to check if the current user is a doctor for a given patient
-- SECURITY DEFINER allows this function to bypass RLS on the tables it queries
create or replace function public.check_doctor_patient_appointment(patient_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 
    from public.appointments a
    where a.patient_id = patient_profile_id 
      and a.doctor_id = auth.uid()
  );
$$;

-- 2. Update the profile policy to use this function instead of a direct subquery
drop policy if exists "Doctor can read patient profiles for own appointments" on public.profiles;

create policy "Doctor can read patient profiles for own appointments" on public.profiles
  for select using (
    public.check_doctor_patient_appointment(id)
  );

-- 3. Optimization: Ensure we have an index on appointments(patient_id, doctor_id)
create index if not exists idx_appointments_patient_doctor 
  on public.appointments(patient_id, doctor_id);

-- 4. Double check the doctor_id column exists on appointments (it should from 20251031074500)
-- But just in case, we rely on it being present.

-- 5. Fix potential recursion in "Anyone can read author profiles for published articles"
-- This was added in 20251210000012_fix_author_profiles_rls.sql
-- We'll make a secure function for this too, just to be safe and performant
create or replace function public.check_is_published_author(author_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.blog_articles ba
    where ba.author_id = author_profile_id
      and ba.status = 'published'
  );
$$;

drop policy if exists "Anyone can read author profiles for published articles" on public.profiles;

create policy "Anyone can read author profiles for published articles" on public.profiles
  for select using (
    public.check_is_published_author(id)
  );
