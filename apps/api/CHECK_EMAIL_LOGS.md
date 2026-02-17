# How to Check Email Notification Logs

## 1. API Server Logs (Terminal)

The API server logs show real-time information about email sending attempts.

### Where to find:
- **Terminal where you ran `npm run start:dev`**
- Look for lines starting with `[NotificationsService]` or `[RemindersService]`

### What to look for:
```
[NotificationsService] Sending email from onboarding@resend.dev to bikashkangabam2@gmail.com
[NotificationsService] Appointment reminder sent to bikashkangabam2@gmail.com, Resend ID: abc123
```

Or errors like:
```
[NotificationsService] Failed to send appointment reminder: [error details]
```

## 2. Database Logs (Supabase)

All email attempts are logged in the `email_notifications` table.

### Check via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/oawkctztcuoxeszukukp
2. Click on **Table Editor** in the left sidebar
3. Find the `email_notifications` table
4. View recent entries

### Check via SQL Query:
Run this query in Supabase SQL Editor:

```sql
SELECT 
  recipient_email,
  notification_type,
  status,
  sent_at,
  error_message
FROM email_notifications
ORDER BY sent_at DESC
LIMIT 20;
```

This will show:
- Which emails were attempted
- Whether they succeeded (`sent`) or failed (`failed`)
- Error messages if they failed
- Timestamp of the attempt

## 3. Resend Dashboard

Check Resend's own logs for delivery status:

1. Go to: https://resend.com/emails
2. Login with your Resend account
3. You'll see:
   - All emails sent
   - Delivery status
   - Bounce/spam reports
   - Detailed error messages

## 4. Test with Detailed Logging

Run the test endpoint and check all three places:

```bash
curl -X POST http://localhost:3001/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"email": "bikashkangabam2@gmail.com"}' \
  -v
```

The `-v` flag shows verbose output including any HTTP errors.

## 5. Common Issues to Check

### Issue: "RESEND_API_KEY not configured"
- **Check**: `.env` file has `RESEND_API_KEY=re_...`
- **Fix**: Add the key and restart the server

### Issue: "Domain not verified"
- **Check**: Resend dashboard → Domains
- **Fix**: Use `onboarding@resend.dev` for testing (already set)

### Issue: "Invalid API key"
- **Check**: Resend dashboard → API Keys
- **Fix**: Generate a new API key and update `.env`

### Issue: Email sent but not received
- **Check**: Spam folder
- **Check**: Resend dashboard for bounce reports
- **Check**: Email address is correct

## 6. Enable More Verbose Logging

The code already logs:
- Email sending attempts
- Resend API responses
- Errors with full details

Check your terminal output when you run the test endpoint.
