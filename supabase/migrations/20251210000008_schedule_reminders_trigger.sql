-- Trigger function to automatically schedule reminders when appointment is accepted
-- This calls the API endpoint to schedule reminders

create or replace function public.schedule_appointment_reminders()
returns trigger as $$
declare
  api_url text;
  request_body jsonb;
begin
  -- Only trigger when status changes to 'accepted'
  if new.status = 'accepted' and (old.status is null or old.status != 'accepted') then
    -- Get API URL from environment or use default
    api_url := coalesce(
      current_setting('app.reminders_api_url', true),
      'http://localhost:3001/notifications/schedule-reminders'
    );

    -- Build request body
    request_body := jsonb_build_object(
      'appointmentId', new.id
    );

    -- Call API endpoint using pg_net (if available)
    -- Note: This requires pg_net extension to be enabled
    -- If pg_net is not available, reminders can be scheduled via API calls from the application
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
      raise warning 'Failed to call reminders API (pg_net may not be enabled): %. Reminders can be scheduled manually via API.', sqlerrm;
    end;
  end if;

  -- Cancel pending reminders if appointment is cancelled or declined
  if new.status in ('cancelled', 'declined') and old.status = 'accepted' then
    update public.appointment_reminders
    set status = 'skipped',
        error_message = 'Appointment ' || new.status
    where appointment_id = new.id
      and status = 'pending';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists trg_schedule_appointment_reminders on public.appointments;
create trigger trg_schedule_appointment_reminders
  after insert or update of status on public.appointments
  for each row
  execute function public.schedule_appointment_reminders();

-- Note: If pg_net extension is not enabled in your Supabase project,
-- you can enable it via: CREATE EXTENSION IF NOT EXISTS pg_net;
-- Or handle reminder scheduling via application API calls instead of database triggers
