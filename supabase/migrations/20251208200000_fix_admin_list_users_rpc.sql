-- Fix admin_list_users RPC to check profiles.role instead of admins table
-- This ensures it works with the current admin system

-- Drop the existing function first to allow changing return type
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  phone text,
  role text,
  doctor_slug text,
  full_name text,
  speciality text,
  registration_number text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Check if user is admin using is_admin() function (SECURITY DEFINER, avoids RLS recursion)
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  -- Return all users from auth.users joined with profiles
  -- This ensures we get ALL users, even those without profiles
  -- Explicitly cast columns to text to match RETURNS TABLE definition
  return query
  select u.id,
         u.email::text as email,
         u.phone::text as phone,
         coalesce(p.role, 'patient')::text as role,
         p.doctor_slug::text,
         p.full_name::text,
         p.speciality::text,
         p.registration_number::text
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_users to authenticated;

