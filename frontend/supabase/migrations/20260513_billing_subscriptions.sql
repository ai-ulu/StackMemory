-- Billing subscription persistence for Stripe-backed plans.
-- Safe to run multiple times.

create table if not exists billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_id text not null default 'free',
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_subscriptions_user_status
  on billing_subscriptions(user_id, status);

create index if not exists idx_billing_subscriptions_customer
  on billing_subscriptions(stripe_customer_id);

create index if not exists idx_billing_subscriptions_updated
  on billing_subscriptions(updated_at desc);

alter table billing_subscriptions enable row level security;

do $$
begin
  drop policy if exists "Users read own billing subscriptions" on billing_subscriptions;
  drop policy if exists "Users insert own billing subscriptions" on billing_subscriptions;
  drop policy if exists "Users update own billing subscriptions" on billing_subscriptions;
exception when others then null;
end $$;

create policy "Users read own billing subscriptions"
  on billing_subscriptions for select to authenticated
  using (auth.uid() = user_id);

-- Normal app users should not write subscription state directly.
-- Stripe webhook writes through service role and bypasses RLS.

grant select on billing_subscriptions to authenticated;
