-- Fix minimum pricing to meet Razorpay requirements
-- Razorpay requires minimum ₹1.00 (100 paisa) for INR transactions

-- Update any pricing entries that are below minimum (100 paisa)
UPDATE appointment_pricing
SET amount = 100  -- ₹1.00 minimum
WHERE amount < 100 
  AND currency = 'INR'
  AND is_active = true;

-- Update any appointments with payment_amount below minimum
UPDATE appointments
SET payment_amount = 100,  -- ₹1.00 minimum
    payment_currency = 'INR'
WHERE payment_amount < 100 
  AND payment_currency = 'INR'
  AND payment_status = 'pending';

-- Ensure default pricing is at least ₹1.00
-- Update existing default pricing to be at least ₹1.00
UPDATE appointment_pricing
SET amount = 100
WHERE doctor_id IS NULL 
  AND is_active = true
  AND currency = 'INR'
  AND amount < 100;

-- If video pricing doesn't exist, create it with minimum ₹1.00
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active, doctor_id)
SELECT 'video', 100, 'INR', true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_pricing 
  WHERE appointment_type = 'video' 
    AND doctor_id IS NULL 
    AND is_active = true
);

-- If in_clinic pricing doesn't exist, create it with minimum ₹1.00
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active, doctor_id)
SELECT 'in_clinic', 100, 'INR', true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_pricing 
  WHERE appointment_type = 'in_clinic' 
    AND doctor_id IS NULL 
    AND is_active = true
);
