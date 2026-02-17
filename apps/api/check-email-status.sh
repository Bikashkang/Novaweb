#!/bin/bash
# Script to check email notification status

echo "=== Checking Email Configuration ==="
echo ""
echo "1. Environment Variables:"
echo "   RESEND_API_KEY: ${RESEND_API_KEY:0:20}..."
echo "   RESEND_FROM_EMAIL: $RESEND_FROM_EMAIL"
echo "   SUPABASE_URL: $SUPABASE_URL"
echo ""
echo "2. Testing Resend API connection..."
curl -X GET "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  2>&1 | head -20
echo ""
echo "3. Check Resend dashboard: https://resend.com/emails"
echo "4. Check Supabase email_notifications table for logs"
