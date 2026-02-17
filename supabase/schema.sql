-- Ensure profiles table exists
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

-- Bring table to expected shape
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists doctor_slug text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists speciality text;
alter table public.profiles add column if not exists registration_number text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

update public.profiles set role = 'patient' where role is null;
alter table public.profiles alter column role set default 'patient';
alter table public.profiles alter column role set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('patient','doctor','admin','medical_professional'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_doctor_slug_key') then
    alter table public.profiles add constraint profiles_doctor_slug_key unique (doctor_slug);
  end if;
end $$;

-- Helper function to check if current user is admin
-- SECURITY DEFINER allows it to bypass RLS and avoid recursion
create or replace function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- RLS for profiles
alter table public.profiles enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles" on public.profiles
  for select using (public.is_admin());

-- Admin can insert profiles (needed for upsert operations)
drop policy if exists "Admin can insert profiles" on public.profiles;
create policy "Admin can insert profiles" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "Admin can update profiles" on public.profiles;
create policy "Admin can update profiles" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- Prevent non-admin role changes
create or replace function public.profiles_no_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_no_role_change on public.profiles;
create trigger trg_profiles_no_role_change
  before update on public.profiles
  for each row execute function public.profiles_no_role_change();