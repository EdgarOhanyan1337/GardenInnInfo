-- ============================================
-- Garden Inn Resort — V5c (with GRANT permissions)
-- Copy ALL into SQL Editor -> Run
-- ============================================

DROP TABLE IF EXISTS minibar_items CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS housekeeping_requests CASCADE;
DROP TABLE IF EXISTS housekeeping_ratings CASCADE;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE minibar_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  title_hy TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_ru TEXT NOT NULL DEFAULT '',
  description_hy TEXT NOT NULL DEFAULT '',
  status_type TEXT NOT NULL DEFAULT 'free',
  icon TEXT NOT NULL DEFAULT '',
  images JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_key TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  title_hy TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_ru TEXT NOT NULL DEFAULT '',
  description_hy TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  images JSONB DEFAULT '[]'::JSONB,
  is_paid BOOLEAN DEFAULT true,
  has_calendar BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT '',
  text_en TEXT NOT NULL DEFAULT '',
  text_ru TEXT NOT NULL DEFAULT '',
  text_hy TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  ru TEXT NOT NULL DEFAULT '',
  hy TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE housekeeping_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  accepted_by TEXT DEFAULT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  tg_messages JSONB DEFAULT '[]'::JSONB,
  eta_minutes INTEGER DEFAULT NULL,
  eta_set_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE housekeeping_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION RECIPIENTS (Telegram + Email)
-- ============================================

CREATE TABLE notification_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('telegram', 'email', 'telegram_booking')),
  value TEXT NOT NULL,
  label TEXT DEFAULT '',
  username TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB PUSH SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_number, subscription)
);

ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON push_subscriptions TO anon, authenticated, service_role;

-- App settings (staff password, etc.)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default staff password
INSERT INTO app_settings (key, value) VALUES ('staff_password', 'gardeninn2026')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DISABLE RLS on all tables
-- ============================================

ALTER TABLE minibar_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE tours DISABLE ROW LEVEL SECURITY;
ALTER TABLE rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT full access to anon and authenticated roles
-- THIS IS THE KEY PART that fixes 403 errors!
-- ============================================

GRANT ALL ON minibar_items TO anon, authenticated, service_role;
GRANT ALL ON services TO anon, authenticated, service_role;
GRANT ALL ON tours TO anon, authenticated, service_role;
GRANT ALL ON rules TO anon, authenticated, service_role;
GRANT ALL ON translations TO anon, authenticated, service_role;
GRANT ALL ON housekeeping_requests TO anon, authenticated, service_role;
GRANT ALL ON housekeeping_ratings TO anon, authenticated, service_role;
GRANT ALL ON notification_recipients TO anon, authenticated, service_role;
GRANT ALL ON app_settings TO anon, authenticated, service_role;

-- Also grant usage on sequences (needed for inserts)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- ENABLE REALTIME FOR FRONTEND STREAMING
-- ============================================

-- Drop tables from publication inside a DO block to avoid errors if they aren't there
DO $$ 
BEGIN 
  -- We just add them directly; duplicate adds are ignored or harmless in the UI
END $$;

-- Enable replication for the tables that the frontend listens to
ALTER PUBLICATION supabase_realtime ADD TABLE translations;
ALTER PUBLICATION supabase_realtime ADD TABLE minibar_items;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE tours;
ALTER PUBLICATION supabase_realtime ADD TABLE rules;
ALTER PUBLICATION supabase_realtime ADD TABLE housekeeping_requests;

-- ============================================
-- STORAGE (bucket only, policies set via Dashboard)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BOOKING SYSTEM EXTENSION
-- ============================================

-- Add booking-related columns to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS has_calendar BOOLEAN DEFAULT false;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  room_number TEXT NOT NULL DEFAULT '',
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT DEFAULT NULL,
  tg_messages JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (service_id IS NOT NULL OR tour_id IS NOT NULL)
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tg_messages JSONB DEFAULT '[]'::JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_from TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_to TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notified_2h BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notified_1h BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notified_15m BOOLEAN DEFAULT false;

ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON bookings TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- DONE! Tables created + RLS disabled + GRANT permissions given.

-- ============================================
-- ROOMS TABLE (for QR-based room auth)
-- ============================================

CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number INTEGER UNIQUE NOT NULL CHECK (room_number >= 1 AND room_number <= 17),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed rooms 1-17
INSERT INTO rooms (room_number)
SELECT generate_series(1, 17)
ON CONFLICT (room_number) DO NOTHING;

ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
GRANT ALL ON rooms TO anon, authenticated, service_role;

-- ============================================
-- STAFF ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS staff_roles (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'admin', 'owner'))
);

ALTER TABLE staff_roles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON staff_roles TO anon, authenticated, service_role;

-- ============================================
-- AUTO-REGISTER ROOM ACCOUNTS
-- ============================================

DO $$
DECLARE
  i INTEGER;
  user_email TEXT;
BEGIN
  FOR i IN 1..17 LOOP
    user_email := 'gardeninn' || i || '@hotel.local';
    
    -- Only insert if email doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at, confirmation_token,
        raw_user_meta_data, raw_app_meta_data
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_email,
        crypt('gardeninnpassword' || i, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        jsonb_build_object('room_number', i::text),
        '{"provider": "email", "providers": ["email"]}'::jsonb
      );
    END IF;

    -- Ensure 'guest' role is assigned
    INSERT INTO staff_roles (email, role) VALUES (user_email, 'guest') ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- HOT DEALS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS hot_deals (
    id uuid default gen_random_uuid() primary key,
    type text not null check (type in ('discount', 'announcement')),
    reference_id text,
    title_en text,
    title_ru text,
    title_hy text,
    description_en text,
    description_ru text,
    description_hy text,
    old_price text,
    new_price text,
    is_paid boolean default false,
    image_url text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE hot_deals DISABLE ROW LEVEL SECURITY;
GRANT ALL ON hot_deals TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE hot_deals;

-- Hot Deals feature toggle
INSERT INTO app_settings (key, value) VALUES ('hot_deals_active', 'true')
ON CONFLICT (key) DO NOTHING;
