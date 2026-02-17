-- Fix search_path for RLS functions
-- SECURITY DEFINER functions run with a fixed search_path (usually 'public') to prevent
-- malicious search_path manipulation. However, this means they cannot find functions
-- in other schemas (like 'auth' or 'extensions') unless explicitly qualified or included
-- in the search_path.
-- auth.uid() is typicaly in the 'auth' or 'extensions' schema.

-- We update all security definer functions to include 'auth' and 'extensions' in their search_path
-- or use fully qualified names / primitives.

-- 1. check_doctor_patient_appointment
create or replace function public.check_doctor_patient_appointment(patient_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, extensions
as $$
  select exists (
    select 1 
    from public.appointments a
    where a.patient_id = patient_profile_id 
      and a.doctor_id = auth.uid()
  );
$$;

-- 2. check_is_published_author
create or replace function public.check_is_published_author(author_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, extensions
as $$
  select exists (
    select 1
    from public.blog_articles ba
    where ba.author_id = author_profile_id
      and ba.status = 'published'
  );
$$;

-- 3. is_doctor_or_medical_professional
create or replace function public.is_doctor_or_medical_professional() 
returns boolean 
language sql
security definer
stable
set search_path = public, auth, extensions
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('doctor', 'medical_professional')
  );
$$;

-- 4. is_admin 
-- (Note: this function was also defined in earlier migrations, we fix it here to be safe)
create or replace function public.is_admin() 
returns boolean 
language sql
security definer
stable
set search_path = public, auth, extensions
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Re-grant execute permissions just in case
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.check_is_published_author(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.check_is_published_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_published_author(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.is_doctor_or_medical_professional() TO public;
GRANT EXECUTE ON FUNCTION public.is_doctor_or_medical_professional() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_doctor_or_medical_professional() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
