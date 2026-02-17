# Supabase Storage Setup for Chat Attachments

## Storage Bucket Configuration

To enable file attachments in chat, you need to create a storage bucket in your Supabase project:

1. Go to your Supabase Dashboard → Storage
2. Create a new bucket named `chat-attachments`
3. Set it as **Public** (for read access)
4. Configure policies:

### Storage Policies

**Allow authenticated users to upload:**
```sql
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');
```

**Allow public read access:**
```sql
CREATE POLICY "Public can read chat attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
```

**Allow users to delete their own uploads:**
```sql
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### File Size Limits

- Images: 10MB max
- Documents: 25MB max

These limits are enforced in the application code (`src/lib/supabase/storage.ts`).

