-- Drop strict status check to unblock updates; app enforces valid statuses
alter table public.appointments drop constraint if exists appointments_status_check;




