# Razorpay Live API Setup - Next Steps

## ✅ What's Done

- ✅ Razorpay live API keys added to `.env` file
- ✅ Payment service configured to use live keys
- ✅ Payment endpoints ready

## 🎯 Next Steps for Production

### 1. Configure Webhook (CRITICAL)

Razorpay webhooks notify your app when payments are completed. This is essential for automatic payment verification.

#### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.com/payments/webhook
```

For local testing, use a service like:
- **ngrok**: `ngrok http 3001` (gives you a public URL)
- **localtunnel**: `lt --port 3001`

#### Step 2: Configure in Razorpay Dashboard

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click **"Add New Webhook"**
3. Enter your webhook URL: `https://your-domain.com/payments/webhook`
4. Select events:
   - ✅ `payment.captured` (required)
   - ✅ `payment.failed` (optional but recommended)
   - ✅ `refund.created` (optional)
5. Copy the **Webhook Secret** (starts with `whsec_`)

#### Step 3: Add Webhook Secret to .env

Add this to your `.env` file:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Test Payment Flow

#### Test with Razorpay Test Cards

Even with live keys, you can test with these cards:
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

#### Test Payment Endpoints

1. **Create Order:**
```bash
curl -X POST http://localhost:3001/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "amount": 50000,
    "currency": "INR"
  }'
```

2. **Verify Payment** (after payment):
```bash
curl -X POST http://localhost:3001/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }'
```

### 3. Set Up Pricing

Configure appointment pricing in your database:

```sql
-- Insert default pricing for video consultations
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active)
VALUES ('video', 50000, 'INR', true)
ON CONFLICT DO NOTHING;

-- Insert default pricing for in-clinic appointments
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active)
VALUES ('in_clinic', 100000, 'INR', true)
ON CONFLICT DO NOTHING;
```

Or use the admin interface at `/admin/pricing` if available.

### 4. Update Frontend Configuration

Make sure your frontend has the Razorpay key ID:

**In `.env.local` (frontend):**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_SDd8Cd2z1LcyAE
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### 5. Security Checklist

- [ ] **Never expose** `RAZORPAY_KEY_SECRET` in frontend code
- [ ] **Always verify** webhook signatures
- [ ] **Use HTTPS** in production
- [ ] **Store keys** only in environment variables
- [ ] **Rotate keys** if compromised
- [ ] **Monitor** payment logs for suspicious activity

### 6. Monitor Payments

#### Check Payment Logs in Database:
```sql
SELECT 
  id,
  appointment_id,
  razorpay_order_id,
  razorpay_payment_id,
  amount,
  currency,
  status,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 20;
```

#### Check Appointment Payment Status:
```sql
SELECT 
  id,
  patient_id,
  payment_status,
  payment_amount,
  payment_id,
  payment_date
FROM appointments
WHERE payment_status IN ('paid', 'failed', 'pending')
ORDER BY created_at DESC;
```

### 7. Handle Refunds

The refund system is already set up. It automatically calculates refund amounts based on cancellation timing:

- **> 24 hours before**: Full refund (100%)
- **12-24 hours before**: 50% refund
- **6-12 hours before**: 25% refund
- **< 6 hours before**: No refund

#### Test Refund:
```bash
curl -X POST http://localhost:3001/payments/refund \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "reason": "Patient cancelled"
  }'
```

### 8. Production Deployment

Before going live:

1. **Update API URL** in webhook configuration
2. **Set environment variables** on your production server
3. **Enable HTTPS** (required for webhooks)
4. **Test webhook** delivery
5. **Monitor** first few transactions
6. **Set up alerts** for failed payments

### 9. Important Notes

⚠️ **Live Keys**: You're now using **LIVE** Razorpay keys. All transactions will be real!

⚠️ **Webhook Required**: Without webhook setup, payments won't be automatically verified. You'll need to manually verify them.

⚠️ **Test First**: Test thoroughly with small amounts before processing real payments.

## 🔍 Troubleshooting

### Payment Not Verified

1. Check webhook is configured correctly
2. Verify webhook secret matches
3. Check API logs for webhook errors
4. Verify signature validation is working

### Webhook Not Receiving Events

1. Check webhook URL is accessible (use ngrok for local testing)
2. Verify webhook is enabled in Razorpay dashboard
3. Check firewall/security settings
4. Verify HTTPS is enabled (required for production)

### Refund Issues

1. Check refund amount calculation
2. Verify payment was successful before refund
3. Check Razorpay dashboard for refund status
4. Review refund logs in database

## 📊 Monitoring Queries

### Payment Success Rate:
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM payments
GROUP BY status;
```

### Recent Payments:
```sql
SELECT 
  p.*,
  a.appt_date,
  a.appt_time
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
ORDER BY p.created_at DESC
LIMIT 20;
```

## 🎉 You're Ready!

Your Razorpay integration is configured with live keys. Make sure to:
1. Set up webhooks (critical!)
2. Test payment flow
3. Configure pricing
4. Monitor transactions

Good luck! 🚀
