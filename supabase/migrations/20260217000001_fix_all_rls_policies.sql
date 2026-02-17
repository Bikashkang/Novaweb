-- Fix RLS policies for profiles and appointments to allow proper access

-- 1. PROFILES: Allow users to view their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- 2. PROFILES: Allow users to update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 3. PROFILES: Allow public to view doctors and medical professionals
-- This is critical for the home page and doctors list
drop policy if exists "Public can view doctors" on public.profiles;
create policy "Public can view doctors" on public.profiles
  for select using (role in ('doctor', 'medical_professional'));

-- 4. APPOINTMENTS: Allow patients to view their own appointments
drop policy if exists "Patients can view their own appointments" on public.appointments;
create policy "Patients can view their own appointments" on public.appointments
  for select using (patient_id = auth.uid());

-- 5. APPOINTMENTS: Allow patients to create appointments
drop policy if exists "Patients can insert their own appointments" on public.appointments;
create policy "Patients can insert their own appointments" on public.appointments
  for insert with check (patient_id = auth.uid());

-- 6. APPOINTMENTS: Allow patients to update their own appointments
-- (e.g. for cancelling or updating details)
drop policy if exists "Patients can update their own appointments" on public.appointments;
create policy "Patients can update their own appointments" on public.appointments
  for update using (patient_id = auth.uid());

-- 7. Ensure authenticated users can read published articles (redundant safety check)
drop policy if exists "Authenticated users can read published articles" on public.blog_articles;
create policy "Authenticated users can read published articles" on public.blog_articles
  for select using (status = 'published');

-- 8. Grant permissions to public/authenticated for necessary functions (redundant but safe)
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO service_role;
