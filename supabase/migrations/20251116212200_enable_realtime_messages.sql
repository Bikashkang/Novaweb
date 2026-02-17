-- Enable replication for messages table to support Supabase Realtime
-- This allows real-time updates when messages are inserted or updated

alter publication supabase_realtime add table public.messages;

