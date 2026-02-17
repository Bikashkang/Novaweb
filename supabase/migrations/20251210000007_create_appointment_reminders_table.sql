-- Appointment reminders tracking table
-- Tracks which reminders have been sent for appointments to prevent duplicates

create table if not exists public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id bigint not null references public.appointments(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('24h_before', '2h_before', '1h_before', 'custom')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz default now()
);

-- Unique constraint: one reminder per appointment per type
create unique index if not exists appointment_reminders_appointment_type_idx 
  on public.appointment_reminders(appointment_id, reminder_type);

-- Indexes for performance
create index if not exists appointment_reminders_appointment_id_idx on public.appointment_reminders(appointment_id);
create index if not exists appointment_reminders_status_idx on public.appointment_reminders(status);
create index if not exists appointment_reminders_scheduled_for_idx on public.appointment_reminders(scheduled_for);
create index if not exists appointment_reminders_pending_idx on public.appointment_reminders(status, scheduled_for) 
  where status = 'pending';

-- Enable RLS
alter table public.appointment_reminders enable row level security;

-- Only admins can read appointment reminders (for auditing)
drop policy if exists "Admins can read appointment reminders" on public.appointment_reminders;
create policy "Admins can read appointment reminders" on public.appointment_reminders
  for select using (public.is_admin());

-- Service role can insert/update (for API to manage reminders)
-- Note: This is handled via service role key, not RLS policy

-- Comments for documentation
comment on table public.appointment_reminders is 'Tracks scheduled reminders for appointments to prevent duplicates';
comment on column public.appointment_reminders.reminder_type is 'Type of reminder: 24h_before, 2h_before, 1h_before, or custom';
comment on column public.appointment_reminders.scheduled_for is 'When the reminder should be sent (appointment time - reminder interval)';
comment on column public.appointment_reminders.status is 'Status: pending (not sent yet), sent (successfully sent), failed (error occurred), skipped (appointment cancelled/resolved)';
