-- Enable replication for video_calls table to support Supabase Realtime

alter publication supabase_realtime add table public.video_calls;

