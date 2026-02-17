-- Allow doctors to read patient profiles for appointments assigned to them

drop policy if exists "Doctor can read patient profiles for own appointments" on public.profiles;
create policy "Doctor can read patient profiles for own appointments" on public.profiles
  for select using (
    exists (
      select 1
      from public.appointments a
      join public.profiles d on d.id = auth.uid() and d.role = 'doctor'
      where a.patient_id = profiles.id
        and a.doctor_identifier = d.doctor_slug
    )
  );




