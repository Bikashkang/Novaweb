-- Storage policies for blog-images bucket
-- IMPORTANT: The bucket itself must be created manually FIRST in Supabase Dashboard → Storage
-- Steps:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name it: blog-images
-- 4. Make it PUBLIC (toggle "Public bucket")
-- 5. Then run this migration to set up the policies

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Doctors and medical professionals can upload blog images" on storage.objects;
drop policy if exists "Public can read blog images" on storage.objects;
drop policy if exists "Authors can delete own blog images" on storage.objects;
drop policy if exists "Admins can delete any blog images" on storage.objects;

-- Allow doctors and medical professionals to upload blog images
create policy "Doctors and medical professionals can upload blog images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'blog-images' and
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('doctor', 'medical_professional')
  )
);

-- Allow public read access to blog images
create policy "Public can read blog images"
on storage.objects for select
to public
using (bucket_id = 'blog-images');

-- Allow authors to delete their own blog images
create policy "Authors can delete own blog images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'blog-images' and
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('doctor', 'medical_professional')
  )
);

-- Allow admins to delete any blog images
create policy "Admins can delete any blog images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'blog-images' and
  public.is_admin()
);
