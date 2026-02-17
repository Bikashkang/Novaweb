-- Enable replication for appointments table to support Supabase Realtime
-- This allows real-time updates when appointments are inserted or updated

alter publication supabase_realtime add table public.appointments;

