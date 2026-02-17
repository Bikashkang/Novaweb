-- Fix permissions for RLS functions
-- The previous migration created security definer functions but didn't explicitly grant
-- execute permissions to the public role. This causes queries to fail for anonymous users
-- and potentially authenticated users depending on default privileges.
-- We must allow everyone to EXECUTE the function, so the RLS policy can evaluate it/
-- (The function itself handles the security logic)

GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_doctor_patient_appointment(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.check_is_published_author(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.check_is_published_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_published_author(uuid) TO service_role;

-- Also ensure the is_doctor_or_medical_professional function is executable
GRANT EXECUTE ON FUNCTION public.is_doctor_or_medical_professional() TO public;
GRANT EXECUTE ON FUNCTION public.is_doctor_or_medical_professional() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_doctor_or_medical_professional() TO service_role;

-- Ensure is_admin is executable (though usually used in policies that work)
GRANT EXECUTE ON FUNCTION public.is_admin() TO public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
