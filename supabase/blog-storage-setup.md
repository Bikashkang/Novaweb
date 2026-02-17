# Supabase Storage Setup for Blog Images

## IMPORTANT: Create the Bucket First!

**Before running migrations**, you must create the storage bucket manually:

1. Go to your Supabase Dashboard → Storage
2. Click **"New bucket"**
3. Name it exactly: `blog-images`
4. **Toggle "Public bucket"** to make it public (required for read access)
5. Click **"Create bucket"**

## Storage Policies

After creating the bucket, run the migration `20251210000001_setup_blog_storage_policies.sql` which will automatically configure the policies below:

### Storage Policies

**Allow doctors and medical professionals to upload:**
```sql
CREATE POLICY "Doctors and medical professionals can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('doctor', 'medical_professional')
  )
);
```

**Allow public read access:**
```sql
CREATE POLICY "Public can read blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');
```

**Allow authors to delete their own uploads:**
```sql
CREATE POLICY "Authors can delete own blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('doctor', 'medical_professional')
  )
);
```

**Allow admins to delete any blog images:**
```sql
CREATE POLICY "Admins can delete any blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  public.is_admin()
);
```

### File Size Limits

- Images: 5MB max
- Supported formats: JPG, PNG, WebP
- These limits are enforced in the application code (`src/components/blog/image-upload.tsx`).
