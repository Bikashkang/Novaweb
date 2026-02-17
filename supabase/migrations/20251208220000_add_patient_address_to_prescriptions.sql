-- Add patient_address field to prescriptions table
-- This allows doctors to manually enter patient address on prescriptions

alter table public.prescriptions
  add column if not exists patient_address text;

-- Add comment for documentation
comment on column public.prescriptions.patient_address is 'Patient address as entered by doctor on prescription';

