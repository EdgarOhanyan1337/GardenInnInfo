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
  type TEXT NOT NULL CHECK (type IN ('telegram', 'email')),
  value TEXT NOT NULL,
  label TEXT DEFAULT '',
  username TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

GRANT ALL ON minibar_items TO anon, authenticated;
GRANT ALL ON services TO anon, authenticated;
GRANT ALL ON tours TO anon, authenticated;
GRANT ALL ON rules TO anon, authenticated;
GRANT ALL ON translations TO anon, authenticated;
GRANT ALL ON housekeeping_requests TO anon, authenticated;
GRANT ALL ON housekeeping_ratings TO anon, authenticated;
GRANT ALL ON notification_recipients TO anon, authenticated;
GRANT ALL ON app_settings TO anon, authenticated;

-- Also grant usage on sequences (needed for inserts)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- STORAGE (bucket only, policies set via Dashboard)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- DONE! Tables created + RLS disabled + GRANT permissions given.
