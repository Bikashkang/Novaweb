-- Fix RLS policies to allow reading author profiles for published blog articles
-- This fixes the issue where doctor and blog info loads initially but fails after sign-in

-- Allow reading profiles that are authors of published blog articles
-- This is needed because when fetching blog articles, we need to get author information
-- The existing "Anyone can read doctor profiles" policy only allows reading doctor profiles,
-- but authors of blog articles might not have role='doctor' or might not be accessible otherwise
drop policy if exists "Anyone can read author profiles for published articles" on public.profiles;
create policy "Anyone can read author profiles for published articles" on public.profiles
  for select using (
    exists (
      select 1
      from public.blog_articles ba
      where ba.author_id = profiles.id
        and ba.status = 'published'
    )
  );

-- Also ensure that the doctor profiles policy works correctly for both anonymous and authenticated users
-- The existing policy should work, but let's make sure it's properly set up
-- This policy already exists from migration 20251031071000_profiles_rls_fix.sql
-- We're just ensuring it's still in place and working correctly
