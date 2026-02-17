-- Remove recursive profiles policy and helper function to fix infinite recursion

drop policy if exists "Doctor can read patient profiles for own appointments" on public.profiles;

drop function if exists public.current_doctor_slug();




