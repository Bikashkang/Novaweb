-- RPC: Return all users with profile info for admins only

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  phone text,
  role text,
  doctor_slug text,
  full_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'Not authorized';
  end if;

  return query
  select u.id,
         coalesce(u.email, null) as email,
         coalesce(u.phone, null) as phone,
         p.role,
         p.doctor_slug,
         p.full_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_users to authenticated;



