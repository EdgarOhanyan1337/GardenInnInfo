-- Garden Inn Resort - Database Schema
-- Paste this into the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Minibar Items
create table minibar_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price integer not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Services
create table services (
  id uuid default uuid_generate_v4() primary key,
  service_key text unique not null,
  title text not null,
  description text not null,
  status_type text not null, -- 'free' or 'paid'
  icon text not null,
  images jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tours
create table tours (
  id uuid default uuid_generate_v4() primary key,
  tour_key text unique not null,
  title text not null,
  description text not null,
  price text not null,
  icon text not null,
  images jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Rules
create table rules (
  id uuid default uuid_generate_v4() primary key,
  icon text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Housekeeping Requests
create table housekeeping_requests (
  id uuid default uuid_generate_v4() primary key,
  room_number text not null,
  status text default 'pending', -- pending, accepted, completed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Housekeeping Ratings
create table housekeeping_ratings (
  id uuid default uuid_generate_v4() primary key,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table minibar_items enable row level security;
alter table services enable row level security;
alter table tours enable row level security;
alter table rules enable row level security;
alter table housekeeping_requests enable row level security;
alter table housekeeping_ratings enable row level security;

-- Policies
create policy "Public read access" on minibar_items for select using (true);
create policy "Public read access" on services for select using (true);
create policy "Public read access" on tours for select using (true);
create policy "Public read access" on rules for select using (true);
create policy "Public insert housekeeping" on housekeeping_requests for insert with check (true);
create policy "Public insert ratings" on housekeeping_ratings for insert with check (true);

-- Admin Access (Requires Auth)
create policy "Admin access minibar" on minibar_items for all to authenticated using (true) with check (true);
create policy "Admin access services" on services for all to authenticated using (true) with check (true);
create policy "Admin access tours" on tours for all to authenticated using (true) with check (true);
create policy "Admin access rules" on rules for all to authenticated using (true) with check (true);
create policy "Admin access housekeeping" on housekeeping_requests for all to authenticated using (true) with check (true);
create policy "Admin access ratings" on housekeeping_ratings for all to authenticated using (true) with check (true);
