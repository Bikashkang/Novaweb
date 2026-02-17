# Razorpay Payment Integration - Setup Complete ✅

## ✅ What's Implemented

- ✅ Razorpay payment button component
- ✅ Payment page with appointment details
- ✅ Payment order creation
- ✅ Payment verification
- ✅ Automatic payment amount setting on appointment creation
- ✅ Email notifications on payment success

## 🚀 Quick Setup Steps

### 1. Set Up Default Pricing (REQUIRED)

Run this SQL migration in Supabase to set up default pricing:

```sql
-- Insert default pricing for video consultations (₹500)
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active)
VALUES ('video', 50000, 'INR', true)
ON CONFLICT DO NOTHING;

-- Insert default pricing for in-clinic appointments (₹1000)
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active)
VALUES ('in_clinic', 100000, 'INR', true)
ON CONFLICT DO NOTHING;
```

Or run the migration file:
```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251210000009_setup_default_pricing.sql
```

### 2. Verify Environment Variables

**Backend (`apps/api/.env`):**
```env
RAZORPAY_KEY_ID=rzp_live_SDd8Cd2z1LcyAE
RAZORPAY_KEY_SECRET=R7ve5Bo6Y9nF5hyvClnNeI14
```

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_SDd8Cd2z1LcyAE
```

### 3. Restart Servers

```bash
# Frontend
npm run dev

# Backend API
cd apps/api
npm run start:dev
```

## 🎯 How It Works

1. **Patient books appointment** → Pricing is fetched and `payment_amount` is set
2. **Patient goes to payment page** → Sees appointment details and amount
3. **Patient clicks "Pay Now"** → Razorpay checkout opens
4. **Patient completes payment** → Payment is verified automatically
5. **Appointment status updates** → Changes to `paid`
6. **Email sent** → Confirmation email to patient and doctor

## 🧪 Testing

### Test Cards (Even with Live Keys):

- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date (e.g., 12/25)

### Test Flow:

1. Book an appointment
2. Go to payment page: `/appointments/[id]/payment`
3. Click "Pay Now"
4. Use test card `4111 1111 1111 1111`
5. Complete payment
6. Verify status changes to "paid"

## 📋 Payment Page Features

- ✅ Shows appointment details
- ✅ Displays payment amount
- ✅ Shows payment status badge
- ✅ "Pay Now" button (when payment is pending)
- ✅ Success/failure messages
- ✅ Error handling

## 🔧 Troubleshooting

### Payment Button Not Showing

1. **Check pricing is configured:**
```sql
SELECT * FROM appointment_pricing WHERE is_active = true;
```

2. **Check appointment has payment_amount:**
```sql
SELECT id, payment_status, payment_amount FROM appointments WHERE id = YOUR_APPOINTMENT_ID;
```

3. **Check payment status is "pending":**
   - Button only shows for `pending` or `failed` status

### Payment Not Working

1. **Check API server is running:**
```bash
cd apps/api && npm run start:dev
```

2. **Check Razorpay key is set:**
   - Frontend: `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Backend: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

3. **Check browser console** for errors

4. **Check API logs** for verification errors

### Pricing Not Found

If you see "Pricing Not Configured":
1. Run the pricing migration SQL
2. Or set up pricing via admin panel: `/admin/pricing`

## 📊 Monitoring

### Check Payment Status:
```sql
SELECT 
  id,
  payment_status,
  payment_amount,
  payment_id,
  payment_date
FROM appointments
WHERE payment_status = 'paid'
ORDER BY payment_date DESC;
```

### Check Failed Payments:
```sql
SELECT * FROM appointments WHERE payment_status = 'failed';
```

## 🎉 You're Ready!

The Razorpay payment integration is fully functional. Just:
1. ✅ Set up default pricing (run SQL migration)
2. ✅ Restart your servers
3. ✅ Test with a test card
4. ✅ Start accepting payments!

## 📝 Next Steps (Optional)

- Set up webhooks for automatic verification (when API is deployed)
- Configure per-doctor pricing
- Set up refund policies
- Add payment analytics
