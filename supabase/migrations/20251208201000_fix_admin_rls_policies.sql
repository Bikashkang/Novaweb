-- Fix RLS policies to use is_admin() SECURITY DEFINER function to avoid recursion
-- The is_admin() function can bypass RLS to check if user is admin

-- Ensure is_admin() function exists and is SECURITY DEFINER
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

-- Update admin policies on profiles to use is_admin() function (avoids recursion)
drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles" on public.profiles
  for select using (public.is_admin());

-- Admin can insert profiles (needed for upsert operations)
drop policy if exists "Admin can insert profiles" on public.profiles;
create policy "Admin can insert profiles" on public.profiles
  for insert with check (public.is_admin());

-- Admin can update any profile
drop policy if exists "Admin can update profiles" on public.profiles;
create policy "Admin can update profiles" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

