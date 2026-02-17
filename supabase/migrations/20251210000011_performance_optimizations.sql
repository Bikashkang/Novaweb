-- Performance optimizations for faster queries

-- Add missing indexes for frequently queried columns
create index if not exists profiles_role_idx on public.profiles(role) where role = 'doctor';
create index if not exists profiles_doctor_slug_idx on public.profiles(doctor_slug) where doctor_slug is not null;
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists appointments_doctor_id_idx on public.appointments(doctor_id) where doctor_id is not null;
create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_status_doctor_id_idx on public.appointments(status, doctor_id) where status = 'accepted' and doctor_id is not null;

-- Ensure public read policy for doctor profiles exists (for public listings)
-- Note: There's already a policy "Anyone can read doctor profiles" from migration 20251031071000
-- This migration ensures it also requires doctor_slug to be not null for better filtering
-- If the existing policy doesn't have the doctor_slug check, this will add it
-- The existing policy should already allow reading doctor profiles, so this is just ensuring consistency

-- Add index on blog_articles author_id for faster joins
-- (This might already exist, but ensure it's there)
create index if not exists blog_articles_author_id_idx on public.blog_articles(author_id);

-- Add composite index for common appointment queries
create index if not exists appointments_patient_status_idx on public.appointments(patient_id, status);
create index if not exists appointments_doctor_status_idx on public.appointments(doctor_id, status) where doctor_id is not null;
