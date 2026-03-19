-- ============================================================
-- DEALMATCH — Supabase Database Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────
create table public.profiles (
  id                   uuid references auth.users(id) on delete cascade primary key,
  full_name            text,
  email                text,
  phone                text,
  avatar_url           text,
  location             text,
  bio                  text,
  role                 text check (role in ('buyer','seller','surveyor','inspector','lender','admin')) default 'buyer',
  buyer_preferences    jsonb default '{}',
  onboarding_completed boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Properties ───────────────────────────────────────────
create table public.properties (
  id             uuid default uuid_generate_v4() primary key,
  seller_id      uuid references public.profiles(id) on delete cascade,
  title          text not null,
  description    text,
  property_type  text check (property_type in ('land','apartment','duplex','detached','terrace','commercial')),
  listing_type   text default 'For Sale',
  price          bigint not null,
  state          text not null,
  city           text not null,
  address        text,
  bedrooms       int,
  bathrooms      int,
  size_sqm       numeric,
  features       text[] default '{}',
  documents      text[] default '{}',
  status         text default 'active' check (status in ('active','pending','sold','removed')),
  view_count     int default 0,
  like_count     int default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── Property images ──────────────────────────────────────
create table public.property_images (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade,
  url         text not null,
  is_primary  boolean default false,
  caption     text,
  created_at  timestamptz default now()
);

-- ─── Swipes ───────────────────────────────────────────────
create table public.swipes (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  action      text check (action in ('like','pass','super')) not null,
  created_at  timestamptz default now(),
  unique (user_id, property_id)
);

-- ─── Matches ──────────────────────────────────────────────
create table public.matches (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.profiles(id) on delete cascade,
  property_id    uuid references public.properties(id) on delete cascade,
  match_score    int,
  match_reasons  text[] default '{}',
  is_shortlisted boolean default false,
  contacted_at   timestamptz,
  created_at     timestamptz default now(),
  unique (user_id, property_id)
);

-- ─── Professionals ────────────────────────────────────────
create table public.professionals (
  id                      uuid default uuid_generate_v4() primary key,
  user_id                 uuid references public.profiles(id),
  professional_type       text check (professional_type in ('surveyor','inspector','lender')),
  full_name               text not null,
  company_name            text,
  email                   text not null,
  phone                   text,
  license_number          text,
  coverage_areas          text,
  bio                     text,
  is_verified             boolean default false,
  is_active               boolean default false,
  subscription_plan       text check (subscription_plan in ('monthly','annual')),
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  referral_count          int default 0,
  rating                  numeric default 0,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ─── Professional applications (pre-payment) ──────────────
create table public.professional_applications (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id),
  professional_type text,
  full_name         text not null,
  email             text not null,
  phone             text,
  company_name      text,
  license_number    text,
  coverage_areas    text,
  plan_type         text,
  status            text default 'pending' check (status in ('pending','approved','rejected')),
  created_at        timestamptz default now()
);

-- ─── Payments ─────────────────────────────────────────────
create table public.payments (
  id                uuid default uuid_generate_v4() primary key,
  reference         text unique not null,
  amount            numeric not null,
  currency          text default 'NGN',
  professional_type text,
  plan_type         text,
  email             text,
  status            text default 'pending',
  created_at        timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────
alter table public.profiles                  enable row level security;
alter table public.properties                enable row level security;
alter table public.property_images           enable row level security;
alter table public.swipes                    enable row level security;
alter table public.matches                   enable row level security;
alter table public.professionals             enable row level security;
alter table public.professional_applications enable row level security;
alter table public.payments                  enable row level security;

-- Profiles: users can read all, write own
create policy "Profiles are publicly readable"  on public.profiles for select using (true);
create policy "Users can update own profile"    on public.profiles for update using (auth.uid() = id);

-- Properties: anyone can read active, sellers can CRUD own
create policy "Active properties are public"    on public.properties for select using (status = 'active');
create policy "Sellers can insert properties"   on public.properties for insert with check (auth.uid() = seller_id);
create policy "Sellers can update own props"    on public.properties for update using (auth.uid() = seller_id);
create policy "Sellers can delete own props"    on public.properties for delete using (auth.uid() = seller_id);

-- Swipes: users can CRUD own swipes
create policy "Users manage own swipes"         on public.swipes for all using (auth.uid() = user_id);

-- Matches: users can CRUD own matches
create policy "Users manage own matches"        on public.matches for all using (auth.uid() = user_id);

-- Professionals: public read for active verified, admins manage all
create policy "Active professionals are public" on public.professionals for select using (is_active = true and is_verified = true);

-- Property images: same as properties
create policy "Property images are public"      on public.property_images for select using (true);
create policy "Sellers can manage images"       on public.property_images for all using (
  auth.uid() = (select seller_id from public.properties where id = property_id)
);

-- ─── Indexes ──────────────────────────────────────────────
create index on public.properties (state, status);
create index on public.properties (property_type, status);
create index on public.properties (price, status);
create index on public.properties (seller_id);
create index on public.swipes (user_id, action);
create index on public.matches (user_id, match_score desc);
create index on public.professionals (professional_type, is_active, is_verified);
