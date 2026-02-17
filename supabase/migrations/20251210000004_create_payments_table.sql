-- Payments audit table for tracking all payment transactions

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id bigint not null references public.appointments(id) on delete cascade,
  razorpay_payment_id text not null unique,
  razorpay_order_id text,
  amount numeric not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'authorized', 'captured', 'failed', 'refunded')),
  method text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists payments_appointment_id_idx on public.payments(appointment_id);
create index if not exists payments_razorpay_payment_id_idx on public.payments(razorpay_payment_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_created_at_idx on public.payments(created_at desc);

-- Enable RLS
alter table public.payments enable row level security;

-- RLS Policies for payments

-- Patients can read payments for their appointments
drop policy if exists "Patients can read own payments" on public.payments;
create policy "Patients can read own payments" on public.payments
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = payments.appointment_id
        and a.patient_id = auth.uid()
    )
  );

-- Doctors can read payments for their appointments
drop policy if exists "Doctors can read payments for their appointments" on public.payments;
create policy "Doctors can read payments for their appointments" on public.payments
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = payments.appointment_id
        and a.doctor_id = auth.uid()
    )
  );

-- Admins can read all payments
drop policy if exists "Admins can read all payments" on public.payments;
create policy "Admins can read all payments" on public.payments
  for select using (public.is_admin());

-- Only system (via service role) can insert/update payments
-- This will be handled via backend API with service role key
-- No insert/update policies for authenticated users to prevent tampering

-- Function to update updated_at timestamp
create or replace function public.update_payments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on payment updates
drop trigger if exists trg_update_payments_updated_at on public.payments;
create trigger trg_update_payments_updated_at
  before update on public.payments
  for each row
  execute function public.update_payments_updated_at();

-- Comments for documentation
comment on table public.payments is 'Audit trail for all payment transactions with Razorpay';
comment on column public.payments.amount is 'Payment amount in smallest currency unit (paise for INR)';
comment on column public.payments.metadata is 'Additional Razorpay payment data stored as JSON';
