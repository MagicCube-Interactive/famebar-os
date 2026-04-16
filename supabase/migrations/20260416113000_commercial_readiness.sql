-- FameBar commercial-readiness incremental migration
-- Safe to apply on top of the currently running production schema.

create extension if not exists "uuid-ossp";

-- Normalize any legacy roles before tightening the constraint.
update public.profiles
set role = 'ambassador'
where role = 'leader';

alter table public.profiles
  alter column role set default 'buyer';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;

  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('buyer', 'ambassador', 'admin'));
end
$$;

alter table public.buyer_profiles
  add column if not exists requested_ambassador_at timestamptz;

alter table public.buyer_profiles
  add column if not exists promoted_at timestamptz;

create index if not exists idx_buyer_profiles_referred_by
  on public.buyer_profiles(referred_by);

alter table public.orders
  alter column buyer_id drop not null;

alter table public.orders
  add column if not exists order_type text;

update public.orders
set order_type = 'retail'
where order_type is null;

alter table public.orders
  alter column order_type set default 'retail';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_order_type_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_order_type_check
      check (order_type in ('retail', 'consignment_sale', 'wholesale_pack'));
  end if;
end
$$;

alter table public.orders
  add column if not exists units integer;

update public.orders
set units = 1
where units is null;

alter table public.orders
  alter column units set default 1;

alter table public.orders
  add column if not exists pack_id uuid;

alter table public.orders
  add column if not exists metadata jsonb;

update public.orders
set metadata = '{}'::jsonb
where metadata is null;

alter table public.orders
  alter column metadata set default '{}'::jsonb;

create table if not exists public.ambassador_packs (
  id uuid default uuid_generate_v4() primary key,
  ambassador_id uuid references public.ambassador_profiles(id) not null,
  mode text not null check (mode in ('consignment', 'wholesale')),
  quantity integer not null default 50,
  status text not null default 'approved' check (status in ('approved', 'selling', 'sold_out', 'settled', 'paid')),
  referral_code_issued text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz default now(),
  units_sold integer not null default 0,
  outstanding_units integer not null default 50,
  cash_retained numeric(12,2) not null default 0,
  remittance_due numeric(12,2) not null default 0,
  remitted_amount numeric(12,2) not null default 0,
  remittance_balance numeric(12,2) not null default 0,
  purchase_order_id uuid references public.orders(id),
  payment_received_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pack_sale_events (
  id uuid default uuid_generate_v4() primary key,
  pack_id uuid references public.ambassador_packs(id) not null,
  order_id uuid references public.orders(id) not null,
  ambassador_id uuid references public.ambassador_profiles(id) not null,
  buyer_id uuid references public.profiles(id),
  units integer not null,
  gross_revenue numeric(12,2) not null,
  ambassador_cash_earned numeric(12,2) not null,
  remittance_due numeric(12,2) not null,
  payment_method text check (payment_method in ('cash', 'zelle', 'venmo')),
  customer_name text,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.pack_remittances (
  id uuid default uuid_generate_v4() primary key,
  pack_id uuid references public.ambassador_packs(id) not null,
  ambassador_id uuid references public.ambassador_profiles(id) not null,
  amount numeric(12,2) not null,
  method text not null check (method in ('ach', 'zelle', 'wire')),
  reference text,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_pack_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_pack_id_fkey
      foreign key (pack_id)
      references public.ambassador_packs(id);
  end if;
end
$$;

create index if not exists idx_orders_type
  on public.orders(order_type);

create index if not exists idx_ambassador_packs_ambassador
  on public.ambassador_packs(ambassador_id);

create index if not exists idx_pack_sale_events_pack
  on public.pack_sale_events(pack_id);

create index if not exists idx_pack_remittances_pack
  on public.pack_remittances(pack_id);

alter table public.ambassador_packs enable row level security;
alter table public.pack_sale_events enable row level security;
alter table public.pack_remittances enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'buyer_profiles'
      and policyname = 'Users can view own buyer profile'
  ) then
    create policy "Users can view own buyer profile"
      on public.buyer_profiles
      for select
      using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'buyer_profiles'
      and policyname = 'Admins can view all buyer profiles'
  ) then
    create policy "Admins can view all buyer profiles"
      on public.buyer_profiles
      for select
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ambassador_packs'
      and policyname = 'Ambassadors can view own packs'
  ) then
    create policy "Ambassadors can view own packs"
      on public.ambassador_packs
      for select
      using (auth.uid() = ambassador_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ambassador_packs'
      and policyname = 'Admins can view all packs'
  ) then
    create policy "Admins can view all packs"
      on public.ambassador_packs
      for select
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pack_sale_events'
      and policyname = 'Ambassadors can view own pack sale events'
  ) then
    create policy "Ambassadors can view own pack sale events"
      on public.pack_sale_events
      for select
      using (auth.uid() = ambassador_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pack_sale_events'
      and policyname = 'Admins can view all pack sale events'
  ) then
    create policy "Admins can view all pack sale events"
      on public.pack_sale_events
      for select
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pack_remittances'
      and policyname = 'Ambassadors can view own remittances'
  ) then
    create policy "Ambassadors can view own remittances"
      on public.pack_remittances
      for select
      using (auth.uid() = ambassador_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pack_remittances'
      and policyname = 'Admins can view all remittances'
  ) then
    create policy "Admins can view all remittances"
      on public.pack_remittances
      for select
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end
$$;
