# Appointment Reminders Service

## Overview

The appointment reminders service automatically sends email reminders to patients before their scheduled appointments. The service supports multiple reminder intervals and prevents duplicate reminders.

## Features

- **Multiple Reminder Intervals**: Supports reminders at 24 hours, 2 hours, and 1 hour before appointments
- **Automatic Scheduling**: Reminders are automatically scheduled when appointments are accepted
- **Duplicate Prevention**: Tracks sent reminders to prevent duplicates
- **Automatic Cleanup**: Cancels pending reminders when appointments are cancelled or declined
- **Flexible Processing**: Processes reminders every 15 minutes to ensure timely delivery

## Database Schema

### `appointment_reminders` Table

Tracks scheduled reminders for appointments:

- `id`: UUID primary key
- `appointment_id`: Reference to the appointment
- `reminder_type`: Type of reminder (`24h_before`, `2h_before`, `1h_before`, `custom`)
- `scheduled_for`: Timestamp when the reminder should be sent
- `sent_at`: Timestamp when the reminder was actually sent
- `status`: Status (`pending`, `sent`, `failed`, `skipped`)
- `error_message`: Error message if reminder failed
- `created_at`: Timestamp when the reminder record was created

## How It Works

### 1. Scheduling Reminders

When an appointment is created or its status changes to `accepted`:

1. A database trigger (`trg_schedule_appointment_reminders`) calls the API endpoint `/notifications/schedule-reminders`
2. The `RemindersService.scheduleRemindersForAppointment()` method:
   - Fetches the appointment details
   - Calculates reminder times for each configured interval (24h, 2h, 1h before)
   - Creates reminder records in the `appointment_reminders` table with status `pending`

### 2. Processing Reminders

A cron job runs every 15 minutes (`processPendingReminders`):

1. Fetches all pending reminders scheduled for the next 15 minutes (or up to 1 hour overdue)
2. For each reminder:
   - Validates the appointment is still accepted
   - Fetches patient and doctor information
   - Sends the reminder email via `NotificationsService`
   - Updates the reminder status to `sent` or `failed`

### 3. Cancelling Reminders

When an appointment is cancelled or declined:

1. The database trigger automatically updates all pending reminders to `skipped` status
2. Alternatively, you can manually cancel reminders via the API endpoint `/notifications/cancel-reminders/:appointmentId`

## Configuration

### Reminder Intervals

Default reminder intervals are configured in `RemindersService`:

```typescript
private readonly reminderConfigs: ReminderConfig[] = [
  { type: '24h_before', hoursBefore: 24, enabled: true },
  { type: '2h_before', hoursBefore: 2, enabled: true },
  { type: '1h_before', hoursBefore: 1, enabled: true },
];
```

To modify intervals, edit the `reminderConfigs` array in `reminders.service.ts`.

### Cron Jobs

- **Every 15 minutes**: Processes pending reminders (`processPendingReminders`)
- **Daily at 9 AM**: Legacy job that also processes reminders (for redundancy)

## API Endpoints

### Schedule Reminders

```http
POST /notifications/schedule-reminders
Content-Type: application/json

{
  "appointmentId": 123
}
```

Schedules reminders for a specific appointment. Called automatically by database triggers.

### Cancel Reminders

```http
POST /notifications/cancel-reminders/:appointmentId
```

Cancels all pending reminders for an appointment.

## Database Migrations

Run the following migrations in order:

1. `20251210000007_create_appointment_reminders_table.sql` - Creates the reminders tracking table
2. `20251210000008_schedule_reminders_trigger.sql` - Creates triggers for automatic scheduling

## Environment Variables

Required environment variables (same as notifications service):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@novahdl.com
FRONTEND_URL=http://localhost:3000
```

## Database Trigger Configuration

The database trigger uses `pg_net` extension to call the API. If `pg_net` is not enabled:

1. Enable it: `CREATE EXTENSION IF NOT EXISTS pg_net;`
2. Or configure the API URL: `SET app.reminders_api_url = 'https://your-api-domain.com/notifications/schedule-reminders';`

If `pg_net` is not available, reminders can still be scheduled manually via API calls from your application when appointments are created/accepted.

## Monitoring

### Check Pending Reminders

```sql
SELECT 
  ar.id,
  ar.appointment_id,
  ar.reminder_type,
  ar.scheduled_for,
  ar.status,
  a.appt_date,
  a.appt_time,
  a.status as appointment_status
FROM appointment_reminders ar
JOIN appointments a ON a.id = ar.appointment_id
WHERE ar.status = 'pending'
ORDER BY ar.scheduled_for;
```

### Check Failed Reminders

```sql
SELECT 
  ar.id,
  ar.appointment_id,
  ar.reminder_type,
  ar.error_message,
  ar.scheduled_for
FROM appointment_reminders ar
WHERE ar.status = 'failed'
ORDER BY ar.scheduled_for DESC;
```

### Check Sent Reminders

```sql
SELECT 
  ar.id,
  ar.appointment_id,
  ar.reminder_type,
  ar.sent_at,
  a.appt_date,
  a.appt_time
FROM appointment_reminders ar
JOIN appointments a ON a.id = ar.appointment_id
WHERE ar.status = 'sent'
ORDER BY ar.sent_at DESC
LIMIT 100;
```

## Troubleshooting

### Reminders Not Being Scheduled

1. Check if the database trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'trg_schedule_appointment_reminders';`
2. Check if `pg_net` extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
3. Check API logs for errors when trigger calls the endpoint
4. Manually schedule reminders via API if needed

### Reminders Not Being Sent

1. Check pending reminders: `SELECT * FROM appointment_reminders WHERE status = 'pending' AND scheduled_for <= NOW();`
2. Check API logs for cron job execution
3. Verify email service (Resend) is configured correctly
4. Check for failed reminders and their error messages

### Duplicate Reminders

The service prevents duplicates using a unique constraint on `(appointment_id, reminder_type)`. If duplicates occur:

1. Check for constraint violations in logs
2. Verify reminder records before sending
3. Check if multiple cron jobs are running simultaneously

## Future Enhancements

- SMS reminders in addition to email
- Configurable reminder intervals per doctor or appointment type
- Reminder preferences in user profiles
- Retry logic for failed reminders
- Webhook notifications for reminder events
