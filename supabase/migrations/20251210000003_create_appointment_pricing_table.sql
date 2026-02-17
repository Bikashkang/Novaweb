-- Appointment pricing configuration table

create table if not exists public.appointment_pricing (
  id uuid primary key default gen_random_uuid(),
  appointment_type text not null check (appointment_type in ('video', 'in_clinic')),
  doctor_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'INR',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create unique constraint: one active pricing per doctor per type
create unique index if not exists appointment_pricing_doctor_type_active_idx 
  on public.appointment_pricing(doctor_id, appointment_type) 
  where is_active = true and doctor_id is not null;

-- Create unique constraint: one active default pricing per type (where doctor_id is null)
create unique index if not exists appointment_pricing_default_type_active_idx 
  on public.appointment_pricing(appointment_type) 
  where is_active = true and doctor_id is null;

-- Indexes for performance
create index if not exists appointment_pricing_type_idx on public.appointment_pricing(appointment_type);
create index if not exists appointment_pricing_doctor_id_idx on public.appointment_pricing(doctor_id) where doctor_id is not null;
create index if not exists appointment_pricing_active_idx on public.appointment_pricing(is_active);

-- Enable RLS
alter table public.appointment_pricing enable row level security;

-- RLS Policies for appointment_pricing

-- Public can read active pricing
drop policy if exists "Public can read active pricing" on public.appointment_pricing;
create policy "Public can read active pricing" on public.appointment_pricing
  for select using (is_active = true);

-- Admins can read all pricing
drop policy if exists "Admins can read all pricing" on public.appointment_pricing;
create policy "Admins can read all pricing" on public.appointment_pricing
  for select using (public.is_admin());

-- Only admins can insert/update/delete pricing
drop policy if exists "Admins can manage pricing" on public.appointment_pricing;
create policy "Admins can manage pricing" on public.appointment_pricing
  for all using (public.is_admin())
  with check (public.is_admin());

-- Function to update updated_at timestamp
create or replace function public.update_appointment_pricing_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on pricing updates
drop trigger if exists trg_update_appointment_pricing_updated_at on public.appointment_pricing;
create trigger trg_update_appointment_pricing_updated_at
  before update on public.appointment_pricing
  for each row
  execute function public.update_appointment_pricing_updated_at();

-- Comments for documentation
comment on table public.appointment_pricing is 'Configurable pricing for appointments. NULL doctor_id means default pricing.';
comment on column public.appointment_pricing.amount is 'Price in smallest currency unit (paise for INR)';
