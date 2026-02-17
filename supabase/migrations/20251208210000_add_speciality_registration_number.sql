-- Add speciality and registration_number columns for doctors and medical professionals

alter table public.profiles 
  add column if not exists speciality text,
  add column if not exists registration_number text;

-- Add comment to document these fields
comment on column public.profiles.speciality is 'Medical speciality for doctors and medical professionals';
comment on column public.profiles.registration_number is 'Professional registration number for doctors and medical professionals';

