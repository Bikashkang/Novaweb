# Fix Minimum Pricing Issue

## Problem
Razorpay requires a minimum transaction amount of ₹1.00 (100 paisa) for INR currency. The current pricing was set to 1 paisa (₹0.01), which is below the minimum.

## Solution

### 1. Run the Migration

Run this migration in your Supabase SQL editor:

```sql
-- File: supabase/migrations/20251210000010_fix_minimum_pricing.sql
```

This migration will:
- Update all pricing entries below ₹1.00 to ₹1.00 minimum
- Update all pending appointments with amounts below ₹1.00
- Ensure default pricing is at least ₹1.00

### 2. API Validation Added

The API now validates that amounts are at least ₹1.00 (100 paisa) before creating Razorpay orders. If an amount is below minimum, you'll get a clear error message.

### 3. Update Pricing in Supabase

If you want to set a higher price (e.g., ₹500 for video consultations):

```sql
-- Update video consultation pricing to ₹500 (50000 paisa)
UPDATE appointment_pricing
SET amount = 50000
WHERE appointment_type = 'video' 
  AND doctor_id IS NULL 
  AND is_active = true;

-- Update in-clinic pricing to ₹1000 (100000 paisa)
UPDATE appointment_pricing
SET amount = 100000
WHERE appointment_type = 'in_clinic' 
  AND doctor_id IS NULL 
  AND is_active = true;
```

### 4. Update Existing Appointment

For the current appointment (#90) that has ₹0.01:

```sql
UPDATE appointments
SET payment_amount = 100  -- ₹1.00 minimum
WHERE id = 90 
  AND payment_status = 'pending';
```

Or set it to match your pricing:

```sql
UPDATE appointments
SET payment_amount = (
  SELECT amount FROM appointment_pricing 
  WHERE appointment_type = 'video' 
    AND doctor_id IS NULL 
    AND is_active = true 
  LIMIT 1
)
WHERE id = 90 
  AND payment_status = 'pending';
```

## Next Steps

1. ✅ Run the migration `20251210000010_fix_minimum_pricing.sql`
2. ✅ Update appointment #90's payment_amount
3. ✅ Test payment flow again
4. ✅ Set your desired pricing (recommended: ₹500+ for video, ₹1000+ for in-clinic)

## Razorpay Minimums

- **INR**: ₹1.00 (100 paisa) minimum
- **USD**: $0.50 minimum
- **EUR**: €0.50 minimum

Always ensure your pricing meets these minimums!
