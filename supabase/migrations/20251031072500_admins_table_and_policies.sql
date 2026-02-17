-- Admins table to avoid recursive self-reference in profiles policies

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;

drop policy if exists "Admins can read own membership" on public.admins;
create policy "Admins can read own membership" on public.admins
  for select using (auth.uid() = user_id);

-- Replace admin policies on profiles to use admins table
drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles" on public.profiles
  for select using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

drop policy if exists "Admin can update profiles" on public.profiles;
create policy "Admin can update profiles" on public.profiles
  for update using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );




