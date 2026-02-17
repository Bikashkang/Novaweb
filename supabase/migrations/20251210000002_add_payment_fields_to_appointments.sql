-- Add payment fields to appointments table

alter table public.appointments
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_id text,
  add column if not exists payment_amount numeric,
  add column if not exists payment_currency text default 'INR',
  add column if not exists payment_date timestamptz,
  add column if not exists refund_amount numeric,
  add column if not exists refund_id text,
  add column if not exists refund_date timestamptz;

-- Add constraint for payment_status
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_payment_status_check') then
    alter table public.appointments add constraint appointments_payment_status_check 
      check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'partial_refund'));
  end if;
end $$;

-- Create index on payment_status for filtering
create index if not exists appointments_payment_status_idx on public.appointments(payment_status);

-- Create index on payment_id for lookups
create index if not exists appointments_payment_id_idx on public.appointments(payment_id) where payment_id is not null;

-- Comments for documentation
comment on column public.appointments.payment_status is 'Payment status: pending, paid, failed, refunded, partial_refund';
comment on column public.appointments.payment_id is 'Razorpay payment ID';
comment on column public.appointments.payment_amount is 'Payment amount in smallest currency unit (paise for INR)';
comment on column public.appointments.refund_amount is 'Refund amount in smallest currency unit';
