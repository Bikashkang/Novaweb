# Razorpay Payment Integration Setup

## Overview

The Razorpay payment system has been integrated into the application. Patients can now pay for appointments after booking, and payments are required before joining video consultations.

## Environment Variables

### Backend API (`apps/api/.env`)

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Supabase Configuration (for backend)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Database Setup

Run the following migrations in order:

1. `20251210000002_add_payment_fields_to_appointments.sql` - Adds payment fields to appointments
2. `20251210000003_create_appointment_pricing_table.sql` - Creates pricing configuration table
3. `20251210000004_create_payments_table.sql` - Creates payments audit table

## Razorpay Dashboard Setup

1. **Create Razorpay Account**: Sign up at https://razorpay.com
2. **Get API Keys**: 
   - Go to Settings → API Keys
   - Copy Key ID and Key Secret
   - Use test keys for development
3. **Configure Webhook**:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-api-domain.com/payments/webhook`
   - Select events: `payment.captured`
   - Copy webhook secret

## Initial Pricing Setup

After running migrations, set up default pricing via the admin interface:

1. Log in as admin
2. Navigate to `/admin/pricing`
3. Add default pricing for:
   - Video consultations (e.g., ₹500)
   - In-clinic appointments (e.g., ₹1000)

You can also set per-doctor pricing by specifying a doctor ID.

## Payment Flow

1. **Booking**: Patient books appointment → Status: `pending`, Payment: `pending`
2. **Payment**: Patient redirected to payment page → Clicks "Pay Now" → Razorpay checkout opens
3. **Verification**: Payment verified via webhook → Status updated to `paid`
4. **Access**: Patient can join video call only if payment is `paid`

## Refund Policy

Partial refunds are calculated based on cancellation timing:
- **> 24 hours before**: Full refund (100%)
- **12-24 hours before**: 50% refund
- **6-12 hours before**: 25% refund
- **< 6 hours before**: No refund

## Testing

Use Razorpay test keys for development:
- Test cards: https://razorpay.com/docs/payments/test-cards/
- Test UPI: Use any UPI ID ending with `@razorpay`

## API Endpoints

- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment
- `POST /payments/refund` - Process refund
- `POST /payments/webhook` - Razorpay webhook handler
- `GET /payments/pricing` - Get pricing (placeholder)

## Security Notes

- Never expose `RAZORPAY_KEY_SECRET` in frontend code
- Always verify webhook signatures
- Use HTTPS in production
- Store sensitive keys in environment variables only
