-- Email notifications audit table

create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  notification_type text not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  sent_at timestamptz default now()
);

-- Indexes for performance
create index if not exists email_notifications_recipient_email_idx on public.email_notifications(recipient_email);
create index if not exists email_notifications_notification_type_idx on public.email_notifications(notification_type);
create index if not exists email_notifications_status_idx on public.email_notifications(status);
create index if not exists email_notifications_sent_at_idx on public.email_notifications(sent_at desc);

-- Enable RLS
alter table public.email_notifications enable row level security;

-- Only admins can read email notifications (for auditing)
drop policy if exists "Admins can read email notifications" on public.email_notifications;
create policy "Admins can read email notifications" on public.email_notifications
  for select using (public.is_admin());

-- Service role can insert (for API to log notifications)
-- Note: This is handled via service role key, not RLS policy
