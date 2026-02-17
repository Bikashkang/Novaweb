-- Set up default pricing for appointments
-- This ensures all appointments have a price set

-- Insert default pricing for video consultations (₹500 = 50000 paise)
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active)
VALUES ('video', 50000, 'INR', true)
ON CONFLICT DO NOTHING;

-- Insert default pricing for in-clinic appointments (₹1000 = 100000 paise)
INSERT INTO appointment_pricing (appointment_type, amount, currency, is_active)
VALUES ('in_clinic', 100000, 'INR', true)
ON CONFLICT DO NOTHING;

-- Update existing appointments without payment_amount to use default pricing
UPDATE appointments a
SET payment_amount = (
  SELECT ap.amount 
  FROM appointment_pricing ap 
  WHERE ap.appointment_type = a.appt_type 
    AND ap.is_active = true 
    AND ap.doctor_id IS NULL
  LIMIT 1
),
payment_currency = 'INR'
WHERE payment_amount IS NULL 
  AND payment_status = 'pending';
