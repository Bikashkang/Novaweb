-- Add 'medical_professional' role to the profiles role constraint

-- Drop the existing constraint
alter table public.profiles drop constraint if exists profiles_role_check;

-- Recreate the constraint with the new role
alter table public.profiles add constraint profiles_role_check 
  check (role in ('patient', 'doctor', 'admin', 'medical_professional'));

