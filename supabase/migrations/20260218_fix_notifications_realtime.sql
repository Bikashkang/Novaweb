
-- Ensure notifications table is in supabase_realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- Verify RLS policies (re-apply to be safe)
alter table public.notifications enable row level security;

-- Users can view own notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

-- Users can update own notifications
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete own notifications (Clear All)
drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- Service role can insert notifications
drop policy if exists "Service role can insert notifications" on public.notifications;
create policy "Service role can insert notifications" on public.notifications
  for insert
  to service_role
  with check (true);
