-- Break recursion in profiles policies by avoiding reading profiles within a profiles policy.

-- Helper: current doctor's slug for the logged-in user
create or replace function public.current_doctor_slug()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.doctor_slug
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Rewrite patient-read policy to use helper function instead of self-join
drop policy if exists "Doctor can read patient profiles for own appointments" on public.profiles;
create policy "Doctor can read patient profiles for own appointments" on public.profiles
  for select using (
    exists (
      select 1
      from public.appointments a
      where a.patient_id = profiles.id
        and a.doctor_identifier = public.current_doctor_slug()
    )
  );




