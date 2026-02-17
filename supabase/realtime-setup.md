# Supabase Realtime Setup for Chat

## Enable Realtime for Messages Table

For real-time message updates to work, you need to enable replication for the `messages` table.

### Method 1: SQL Migration (Recommended)

Run the migration file:
```sql
alter publication supabase_realtime add table public.messages;
```

### Method 2: Supabase Dashboard

1. Go to your Supabase Dashboard → Database → Replication
2. Find the `messages` table in the list
3. Toggle the switch to enable replication
4. Click "Save"

### Verify Realtime is Working

After enabling replication:
1. Open the chat interface in two browser windows/tabs
2. Send a message from one window
3. The message should appear immediately in the other window without refresh

## Troubleshooting

If messages don't appear in real-time:

1. **Check Replication Status**: Go to Database → Replication and verify `messages` table is enabled
2. **Check RLS Policies**: Ensure your RLS policies allow reading messages (they should)
3. **Check Browser Console**: Look for any errors related to Supabase subscriptions
4. **Verify Subscription**: The subscription should be active - check Network tab for WebSocket connections

## Notes

- Realtime subscriptions work automatically once replication is enabled
- The chat interface uses optimistic updates, so messages appear immediately when sent
- Incoming messages from other users appear via the realtime subscription
- Read receipts are updated via UPDATE events on the messages table



