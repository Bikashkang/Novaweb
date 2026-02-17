-- Fix stack depth recursion in profiles RLS by making is_admin() SECURITY DEFINER
-- and allow authenticated users to read doctor profiles

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Allow reading doctor profiles for listings
drop policy if exists "Anyone can read doctor profiles" on public.profiles;
create policy "Anyone can read doctor profiles" on public.profiles
  for select using (role = 'doctor');




