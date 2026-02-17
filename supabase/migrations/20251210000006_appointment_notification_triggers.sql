-- Database triggers to send email notifications when appointment status changes
-- Note: This requires pg_net extension or HTTP extension to be enabled in Supabase

-- Function to call notification API when appointment status changes
create or replace function public.notify_appointment_status_changed()
returns trigger as $$
declare
  api_url text;
  patient_email text;
  doctor_email text;
  patient_name text;
  doctor_name text;
  request_body jsonb;
  response_status int;
begin
  -- Only trigger on status changes
  if old.status = new.status then
    return new;
  end if;

  -- Skip if status is still pending (only notify on accept/decline/cancel)
  if new.status not in ('accepted', 'declined', 'cancelled') then
    return new;
  end if;

  -- Get API URL from environment or use default
  api_url := coalesce(
    current_setting('app.notification_api_url', true),
    'http://localhost:3001/notifications/appointment-status-changed'
  );

  -- Fetch patient email from auth.users
  select email into patient_email
  from auth.users
  where id = new.patient_id;

  -- Fetch doctor email from auth.users
  select email into doctor_email
  from auth.users
  where id = new.doctor_id;

  -- Fetch patient name from profiles
  select full_name into patient_name
  from public.profiles
  where id = new.patient_id;

  -- Fetch doctor name from profiles
  select full_name into doctor_name
  from public.profiles
  where id = new.doctor_id;

  -- Only proceed if we have patient email
  if patient_email is null then
    raise warning 'Cannot send notification: patient email not found for appointment %', new.id;
    return new;
  end if;

  -- Build request body
  request_body := jsonb_build_object(
    'appointmentId', new.id,
    'patientId', new.patient_id,
    'patientEmail', patient_email,
    'patientName', coalesce(patient_name, 'Patient'),
    'doctorId', new.doctor_id,
    'doctorEmail', coalesce(doctor_email, ''),
    'doctorName', coalesce(doctor_name, 'Doctor'),
    'appointmentDate', new.appt_date::text,
    'appointmentTime', new.appt_time,
    'appointmentType', new.appt_type,
    'status', new.status
  );

  -- Call API endpoint using pg_net (if available)
  -- Note: This requires pg_net extension to be enabled
  -- If pg_net is not available, this will be handled by frontend calls instead
  begin
    perform
      net.http_post(
        url := api_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := request_body::text
      );
  exception when others then
    -- If pg_net is not available, log warning but don't fail the transaction
    raise warning 'Failed to call notification API (pg_net may not be enabled): %', sqlerrm;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists trg_appointment_status_notification on public.appointments;
create trigger trg_appointment_status_notification
  after update of status on public.appointments
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_appointment_status_changed();

-- Note: If pg_net extension is not enabled in your Supabase project,
-- you can enable it via: CREATE EXTENSION IF NOT EXISTS pg_net;
-- Or handle notifications via frontend API calls instead of database triggers
