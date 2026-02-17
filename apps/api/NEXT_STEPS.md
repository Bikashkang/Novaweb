# Next Steps - Reminder Service Setup

## ✅ What's Done

- ✅ Database migrations created (`appointment_reminders` table)
- ✅ Reminder service with multiple intervals (24h, 2h, 1h before)
- ✅ Email notifications working
- ✅ Environment variables configured
- ✅ Cron jobs set up (every 15 minutes)

## 🎯 What to Do Next

### 1. Enable pg_net Extension (for Automatic Scheduling)

The database trigger needs `pg_net` to automatically schedule reminders when appointments are accepted.

**Run this in Supabase SQL Editor:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Or verify it's enabled:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

### 2. Test Reminder Scheduling

#### Option A: Test with a Real Appointment

1. Create an appointment in your app
2. Accept the appointment (status = 'accepted')
3. Check if reminders were scheduled:

```sql
SELECT 
  ar.id,
  ar.appointment_id,
  ar.reminder_type,
  ar.scheduled_for,
  ar.status,
  a.appt_date,
  a.appt_time
FROM appointment_reminders ar
JOIN appointments a ON a.id = ar.appointment_id
WHERE ar.appointment_id = YOUR_APPOINTMENT_ID;
```

You should see 3 reminders (24h, 2h, 1h before).

#### Option B: Manually Schedule Reminders

If the trigger doesn't work, manually schedule reminders:

```bash
curl -X POST http://localhost:3001/notifications/schedule-reminders \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": YOUR_APPOINTMENT_ID}'
```

### 3. Verify Cron Jobs Are Running

Check your API server logs. Every 15 minutes you should see:

```
[RemindersService] Processing pending appointment reminders...
[RemindersService] Found X pending reminders to process.
```

### 4. Test with Upcoming Appointments

Create test appointments scheduled for:
- **1 hour from now** - to test 1h reminder (will be sent in ~15 minutes)
- **2 hours from now** - to test 2h reminder
- **Tomorrow** - to test 24h reminder

### 5. Monitor Email Delivery

#### Check Database Logs:
```sql
SELECT 
  recipient_email,
  notification_type,
  status,
  sent_at,
  error_message
FROM email_notifications
WHERE notification_type = 'appointment_reminder'
ORDER BY sent_at DESC
LIMIT 20;
```

#### Check Resend Dashboard:
- Go to: https://resend.com/emails
- View delivery status and any bounces

### 6. Verify Reminder Cancellation

Test that reminders are cancelled when appointments are cancelled:

1. Create and accept an appointment
2. Verify reminders are scheduled
3. Cancel the appointment
4. Check that reminders are marked as 'skipped':

```sql
SELECT * FROM appointment_reminders 
WHERE appointment_id = YOUR_APPOINTMENT_ID;
```

All should have `status = 'skipped'`.

## 🔧 Troubleshooting

### Reminders Not Being Scheduled Automatically

1. **Check if trigger exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_schedule_appointment_reminders';
```

2. **Check if pg_net is enabled:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

3. **Check API logs** for errors when appointments are created/accepted

4. **Manually schedule** via API endpoint if needed

### Reminders Not Being Sent

1. **Check pending reminders:**
```sql
SELECT * FROM appointment_reminders 
WHERE status = 'pending' 
AND scheduled_for <= NOW() + INTERVAL '15 minutes';
```

2. **Check cron job logs** - should run every 15 minutes

3. **Check for failed reminders:**
```sql
SELECT * FROM appointment_reminders WHERE status = 'failed';
```

### Emails Not Being Received

1. Check spam folder
2. Check Resend dashboard for delivery status
3. Verify email address is correct
4. Check `email_notifications` table for errors

## 📊 Monitoring Queries

### View All Scheduled Reminders:
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

### View Reminder Statistics:
```sql
SELECT 
  reminder_type,
  status,
  COUNT(*) as count
FROM appointment_reminders
GROUP BY reminder_type, status
ORDER BY reminder_type, status;
```

### View Recent Email Activity:
```sql
SELECT 
  recipient_email,
  notification_type,
  status,
  sent_at,
  error_message
FROM email_notifications
WHERE notification_type = 'appointment_reminder'
ORDER BY sent_at DESC
LIMIT 50;
```

## 🚀 Production Checklist

Before going to production:

- [ ] Verify all environment variables are set correctly
- [ ] Test with real appointments
- [ ] Verify cron jobs are running reliably
- [ ] Set up monitoring/alerts for failed reminders
- [ ] Verify email domain is verified in Resend (not using test domain)
- [ ] Test reminder cancellation flow
- [ ] Monitor email delivery rates
- [ ] Set up error alerting

## 📝 Configuration

### Adjust Reminder Intervals

Edit `apps/api/src/notifications/reminders.service.ts`:

```typescript
private readonly reminderConfigs: ReminderConfig[] = [
  { type: '24h_before', hoursBefore: 24, enabled: true },
  { type: '2h_before', hoursBefore: 2, enabled: true },
  { type: '1h_before', hoursBefore: 1, enabled: true },
];
```

### Change Cron Schedule

Edit the `@Cron` decorator in `reminders.service.ts`:

```typescript
@Cron('*/15 * * * *') // Every 15 minutes
// Or use: CronExpression.EVERY_HOUR
```

## 🎉 You're All Set!

The reminder service is now fully functional. It will:
- Automatically schedule reminders when appointments are accepted
- Send reminders at 24h, 2h, and 1h before appointments
- Cancel reminders if appointments are cancelled
- Log all email activity for monitoring
