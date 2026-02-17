# Testing Email Notifications

## Quick Test

### 1. Start the API Server

```bash
cd apps/api
npm run start:dev
```

Make sure your `.env` file has:
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_EMAIL` - Your verified email domain (or use `onboarding@resend.dev` for testing)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### 2. Send a Test Email

Use curl or any HTTP client to send a test email:

```bash
curl -X POST http://localhost:3001/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com"
  }'
```

Replace `your-email@example.com` with your actual email address.

### 3. Check the Response

You should see:
```json
{
  "success": true,
  "message": "Test email sent successfully to your-email@example.com. Check your inbox!"
}
```

### 4. Verify Email Delivery

- Check your inbox (and spam folder)
- You should receive an appointment reminder email
- Check the API logs for confirmation

## Testing Different Notification Types

### Test Appointment Reminder

```bash
curl -X POST http://localhost:3001/notifications/appointment-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "patientId": "patient-uuid",
    "patientEmail": "patient@example.com",
    "patientName": "John Doe",
    "doctorId": "doctor-uuid",
    "doctorEmail": "doctor@example.com",
    "doctorName": "Dr. Smith",
    "appointmentDate": "2025-02-08",
    "appointmentTime": "10:00 AM",
    "appointmentType": "video"
  }'
```

### Test Appointment Created

```bash
curl -X POST http://localhost:3001/notifications/appointment-created \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "patientId": "patient-uuid",
    "patientEmail": "patient@example.com",
    "patientName": "John Doe",
    "doctorId": "doctor-uuid",
    "doctorEmail": "doctor@example.com",
    "doctorName": "Dr. Smith",
    "appointmentDate": "2025-02-08",
    "appointmentTime": "10:00 AM",
    "appointmentType": "video"
  }'
```

## Check Email Logs in Database

After sending a test email, check the `email_notifications` table:

```sql
SELECT 
  recipient_email,
  notification_type,
  status,
  sent_at,
  error_message
FROM email_notifications
ORDER BY sent_at DESC
LIMIT 10;
```

## Troubleshooting

### Email Not Sending

1. **Check API logs** - Look for error messages
2. **Verify Resend API Key** - Make sure it's correct in `.env`
3. **Check Resend Dashboard** - Go to https://resend.com/emails to see delivery status
4. **Verify Email Domain** - If using custom domain, make sure it's verified in Resend
5. **Check Spam Folder** - Emails might be filtered

### Common Errors

- `RESEND_API_KEY not configured` - Add your Resend API key to `.env`
- `Failed to send email` - Check Resend API key and domain verification
- `Supabase credentials not configured` - Add Supabase URL and service role key

### Verify Environment Variables

Check if your API is reading the environment variables correctly:

```bash
cd apps/api
node -e "require('dotenv').config(); console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');"
```

## Using Postman or Insomnia

1. Create a POST request to `http://localhost:3001/notifications/test`
2. Set Content-Type header to `application/json`
3. Body (JSON):
```json
{
  "email": "your-email@example.com"
}
```
4. Send the request

## Testing with Real Appointments

To test with real appointment data:

1. Create an appointment in your app
2. Accept the appointment (status = 'accepted')
3. The trigger should automatically schedule reminders
4. Check `appointment_reminders` table for scheduled reminders
5. Wait for the cron job to process (runs every 15 minutes)
6. Or manually trigger reminder processing by calling the endpoint
