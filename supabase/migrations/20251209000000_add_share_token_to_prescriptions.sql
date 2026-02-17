-- Add share_token column to prescriptions table for shareable links
-- This allows authenticated users to share prescriptions via unique tokens

alter table public.prescriptions
  add column if not exists share_token text;

-- Create unique index on share_token for fast lookups
create unique index if not exists prescriptions_share_token_idx 
  on public.prescriptions(share_token) 
  where share_token is not null;

-- Add comment for documentation
comment on column public.prescriptions.share_token is 'Unique token for sharing prescription with authenticated users. Generated on-demand when user clicks share button.';

-- RLS Policy: Allow authenticated users to read prescriptions via share token
-- This policy allows any authenticated user to read a prescription if they have the share_token
-- The actual token validation happens in the application layer via getPrescriptionByShareToken
drop policy if exists "Users can read prescriptions via share token" on public.prescriptions;
create policy "Users can read prescriptions via share token" on public.prescriptions
  for select using (
    auth.uid() is not null and
    share_token is not null
  );

