#!/bin/bash

# Test Email Notification System
# Usage: ./test-email.sh your-email@example.com

API_URL="${API_URL:-http://localhost:3001}"
EMAIL="${1:-test@example.com}"

echo "🧪 Testing Email Notification System"
echo "=================================="
echo "API URL: $API_URL"
echo "Test Email: $EMAIL"
echo ""

# Test the test endpoint
echo "📧 Sending test email..."
RESPONSE=$(curl -s -X POST "$API_URL/notifications/test" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Response: $RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Test email sent successfully!"
  echo "📬 Check your inbox at: $EMAIL"
  echo "   (Don't forget to check spam folder)"
else
  echo "❌ Failed to send test email"
  echo "   Check API logs for details"
fi

echo ""
echo "💡 Tip: Check email_notifications table in Supabase to see the log:"
echo "   SELECT * FROM email_notifications ORDER BY sent_at DESC LIMIT 5;"
