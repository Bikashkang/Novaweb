-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,           -- 'appointment_accepted', 'appointment_declined', 'appointment_cancelled', 'prescription_created', 'appointment_reminder', 'video_call_ready'
  title text not null,
  body text not null,
  data jsonb default '{}',      -- extra context (appointment_id, etc.)
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_user_id_read_idx on public.notifications(user_id, read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- Enable RLS
alter table public.notifications enable row level security;

-- Users can only see their own notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

-- Users can mark their own notifications as read
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role / triggers can insert notifications
drop policy if exists "Service role can insert notifications" on public.notifications;
create policy "Service role can insert notifications" on public.notifications
  for insert with check (true);

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: notify patient when appointment status changes
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_name text;
  v_title text;
  v_body text;
  v_type text;
begin
  -- Only fire on status changes
  if new.status = old.status then
    return new;
  end if;

  -- Get doctor name
  select coalesce(full_name, doctor_slug, 'Your doctor')
    into v_doctor_name
    from public.profiles
   where doctor_slug = new.doctor_identifier
   limit 1;

  if new.status = 'accepted' then
    v_type  := 'appointment_accepted';
    v_title := 'Appointment Confirmed ✓';
    v_body  := 'Your appointment with ' || v_doctor_name || ' on ' || to_char(new.appt_date, 'Mon DD, YYYY') || ' has been confirmed.';
  elsif new.status = 'declined' then
    v_type  := 'appointment_declined';
    v_title := 'Appointment Declined';
    v_body  := 'Unfortunately, ' || v_doctor_name || ' has declined your appointment on ' || to_char(new.appt_date, 'Mon DD, YYYY') || '.';
  elsif new.status = 'cancelled' then
    v_type  := 'appointment_cancelled';
    v_title := 'Appointment Cancelled';
    v_body  := 'Your appointment with ' || v_doctor_name || ' on ' || to_char(new.appt_date, 'Mon DD, YYYY') || ' has been cancelled.';
  else
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.patient_id,
    v_type,
    v_title,
    v_body,
    jsonb_build_object('appointment_id', new.id, 'doctor_name', v_doctor_name, 'appt_date', new.appt_date, 'appt_time', new.appt_time)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_appointment_status on public.appointments;
create trigger trg_notify_appointment_status
  after update on public.appointments
  for each row execute function public.notify_appointment_status_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: notify patient when appointment is first created (confirmation)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_appointment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_name text;
begin
  select coalesce(full_name, doctor_slug, 'Your doctor')
    into v_doctor_name
    from public.profiles
   where doctor_slug = new.doctor_identifier
   limit 1;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.patient_id,
    'appointment_booked',
    'Appointment Requested 📅',
    'Your appointment with ' || v_doctor_name || ' on ' || to_char(new.appt_date, 'Mon DD, YYYY') || ' at ' || new.appt_time || ' is pending confirmation.',
    jsonb_build_object('appointment_id', new.id, 'doctor_name', v_doctor_name, 'appt_date', new.appt_date, 'appt_time', new.appt_time)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_appointment_created on public.appointments;
create trigger trg_notify_appointment_created
  after insert on public.appointments
  for each row execute function public.notify_appointment_created();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: notify patient when a prescription is created for them
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_prescription_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_name text;
begin
  select coalesce(full_name, doctor_slug, 'Your doctor')
    into v_doctor_name
    from public.profiles
   where id = new.doctor_id
   limit 1;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.patient_id,
    'prescription_created',
    'New Prescription 💊',
    v_doctor_name || ' has issued you a new prescription.',
    jsonb_build_object('prescription_id', new.id, 'doctor_name', v_doctor_name)
  );

  return new;
end;
$$;

-- Only create trigger if prescriptions table exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'prescriptions') then
    drop trigger if exists trg_notify_prescription_created on public.prescriptions;
    create trigger trg_notify_prescription_created
      after insert on public.prescriptions
      for each row execute function public.notify_prescription_created();
  end if;
end;
$$;
