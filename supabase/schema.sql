-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (Extends Supabase auth.users)
-- ============================================================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'buyer' check (role in ('buyer', 'ambassador', 'leader', 'admin')),
  avatar_url text,
  telegram_handle text,
  telegram_chat_id text,
  signal_handle text,
  phone text,
  is_verified boolean default false,
  age_verified boolean default false,
  age_verification_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- AMBASSADOR PROFILES
-- ============================================================================

create table public.ambassador_profiles (
  id uuid references public.profiles on delete cascade primary key,
  sponsor_id uuid references public.ambassador_profiles(id),
  referral_code text unique not null,
  tier integer default 0,
  rank text default 'new',
  is_founder boolean default false,
  founder_start_date timestamptz,
  is_active boolean default false,
  personal_sales_this_month numeric(10,2) default 0,
  total_sales numeric(12,2) default 0,
  total_recruits integer default 0,
  kyc_verified boolean default false,
  payout_method text,
  payout_details jsonb,
  campaign_tags text[] default '{}',
  event_tags text[] default '{}',
  preferred_message_categories text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- BUYER PROFILES
-- ============================================================================

create table public.buyer_profiles (
  id uuid references public.profiles on delete cascade primary key,
  referred_by uuid references public.ambassador_profiles(id),
  fame_balance numeric(12,2) default 0,
  hold_to_save_tier integer default 0,
  total_orders integer default 0,
  created_at timestamptz default now()
);

-- ============================================================================
-- ORDERS
-- ============================================================================

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles not null,
  ambassador_code text not null,
  ambassador_id uuid references public.ambassador_profiles,
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null,
  discount numeric(10,2) default 0,
  total numeric(10,2) not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  settlement_status text default 'pending' check (settlement_status in ('pending', 'settled', 'refunded', 'clawedback')),
  referral_chain jsonb default '[]',
  age_verified boolean default false,
  created_at timestamptz default now(),
  settled_at timestamptz,
  refunded_at timestamptz
);

-- ============================================================================
-- COMMISSION EVENTS
-- ============================================================================

create table public.commission_events (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders not null,
  ambassador_id uuid references public.ambassador_profiles not null,
  tier integer not null check (tier >= 0 and tier <= 6),
  rate numeric(5,4) not null,
  amount numeric(10,2) not null,
  status text default 'pending' check (status in ('pending', 'available', 'paid', 'clawedback')),
  source_ambassador_id uuid references public.ambassador_profiles,
  created_at timestamptz default now(),
  available_at timestamptz,
  paid_at timestamptz
);

-- ============================================================================
-- TOKEN EVENTS
-- ============================================================================

create table public.token_events (
  id uuid default uuid_generate_v4() primary key,
  ambassador_id uuid references public.ambassador_profiles not null,
  order_id uuid references public.orders,
  tokens_earned numeric(12,2) not null,
  founder_multiplier numeric(3,1) default 1.0,
  final_tokens numeric(12,2) not null,
  status text default 'pending' check (status in ('pending', 'available', 'spent', 'clawedback')),
  created_at timestamptz default now()
);

-- ============================================================================
-- REFERRAL CODES
-- ============================================================================

create table public.referral_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  ambassador_id uuid references public.ambassador_profiles not null,
  type text default 'primary' check (type in ('primary', 'campaign', 'event')),
  campaign_name text,
  expires_at timestamptz,
  is_active boolean default true,
  usage_count integer default 0,
  created_at timestamptz default now()
);

-- ============================================================================
-- TEAM TREE (GENEALOGY)
-- ============================================================================

create table public.team_nodes (
  ambassador_id uuid references public.ambassador_profiles primary key,
  sponsor_id uuid references public.ambassador_profiles,
  level integer default 0,
  path uuid[] default '{}',
  direct_recruits uuid[] default '{}',
  personal_sales_this_month numeric(10,2) default 0,
  team_sales_this_month numeric(10,2) default 0,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  target_segment jsonb,
  message_template text,
  channel text,
  status text default 'draft',
  metrics jsonb default '{"sent": 0, "delivered": 0, "clicked": 0, "converted": 0}',
  created_at timestamptz default now()
);

-- ============================================================================
-- EVENTS
-- ============================================================================

create table public.events (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  date timestamptz,
  location text,
  type text,
  rsvp_list uuid[] default '{}',
  ambassador_host uuid references public.ambassador_profiles,
  campus_id text,
  created_at timestamptz default now()
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  action text not null,
  performed_by uuid references public.profiles,
  target_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- TELEGRAM CONTACTS
-- ============================================================================

create table public.telegram_contacts (
  id uuid references public.profiles primary key,
  username text,
  chat_id text,
  opt_in_status boolean default false,
  campus text,
  rank text,
  active_status boolean default false,
  campaign_tags text[] default '{}',
  event_tags text[] default '{}',
  preferred_categories text[] default '{}',
  muted_at timestamptz
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_ambassador on public.orders(ambassador_id);
create index idx_orders_status on public.orders(settlement_status);
create index idx_commission_order on public.commission_events(order_id);
create index idx_commission_ambassador on public.commission_events(ambassador_id);
create index idx_token_ambassador on public.token_events(ambassador_id);
create index idx_referral_code on public.referral_codes(code);
create index idx_team_sponsor on public.team_nodes(sponsor_id);

-- ============================================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, telegram_handle, signal_handle)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    new.raw_user_meta_data->>'telegram_handle',
    new.raw_user_meta_data->>'signal_handle'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.ambassador_profiles enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.commission_events enable row level security;
alter table public.token_events enable row level security;
alter table public.referral_codes enable row level security;
alter table public.team_nodes enable row level security;
alter table public.campaigns enable row level security;
alter table public.events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.telegram_contacts enable row level security;

-- Profile policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Order policies
create policy "Buyers can view own orders" on public.orders for select using (auth.uid() = buyer_id);
create policy "Ambassadors can view orders with their code" on public.orders for select using (
  auth.uid() = ambassador_id
);
create policy "Admins can view all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Commission policies
create policy "Ambassadors can view own commissions" on public.commission_events for select using (auth.uid() = ambassador_id);
create policy "Admins can view all commissions" on public.commission_events for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Token policies
create policy "Ambassadors can view own tokens" on public.token_events for select using (auth.uid() = ambassador_id);

-- Referral code policies
create policy "Anyone can read active codes" on public.referral_codes for select using (is_active = true);
create policy "Ambassadors can manage own codes" on public.referral_codes for all using (auth.uid() = ambassador_id);

-- Team node policies
create policy "Ambassadors can view own team" on public.team_nodes for select using (auth.uid() = ambassador_id or auth.uid() = sponsor_id);

-- Event/campaign policies (public read)
create policy "Anyone can view events" on public.events for select using (true);
create policy "Anyone can view campaigns" on public.campaigns for select using (true);

-- Audit log (admin only)
create policy "Admins can view audit logs" on public.audit_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
