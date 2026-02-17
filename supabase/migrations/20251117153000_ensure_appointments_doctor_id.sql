-- Ensure doctor_id is automatically set from doctor_identifier on insert
-- This ensures appointments are always visible to doctors via RLS policy

-- Function to set doctor_id from doctor_identifier if not already set
create or replace function public.appointments_set_doctor_id()
returns trigger as $$
declare
  doctor_uuid uuid;
begin
  -- Always set doctor_id from doctor_identifier to ensure consistency
  if new.doctor_identifier is not null then
    select p.id into doctor_uuid
    from public.profiles p
    where p.doctor_slug = new.doctor_identifier
    limit 1;
    
    -- Only set if we found a matching profile
    if doctor_uuid is not null then
      new.doctor_id := doctor_uuid;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and create new one
drop trigger if exists trg_appointments_set_doctor_id on public.appointments;
create trigger trg_appointments_set_doctor_id
  before insert or update on public.appointments
  for each row
  when (new.doctor_identifier is not null)
  execute function public.appointments_set_doctor_id();

-- Backfill any appointments that might have NULL doctor_id
update public.appointments a
set doctor_id = p.id
from public.profiles p
where a.doctor_identifier = p.doctor_slug
  and a.doctor_id is null;

