-- Add patient_name and patient_age fields to prescriptions table
-- These allow doctors to manually enter patient information

alter table public.prescriptions
  add column if not exists patient_name text,
  add column if not exists patient_age text;

-- Add comment for documentation
comment on column public.prescriptions.patient_name is 'Patient name as entered by doctor (can differ from profile name)';
comment on column public.prescriptions.patient_age is 'Patient age as entered by doctor';

