-- ============================================
-- Garden Inn Resort — V5 (Housekeeping Codes + Multi-lang)
-- Copy ALL into SQL Editor -> Run
-- ============================================

DROP TABLE IF EXISTS minibar_items CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS housekeeping_requests CASCADE;
DROP TABLE IF EXISTS housekeeping_ratings CASCADE;

-- Clean storage policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "img_select" ON storage.objects;
  DROP POLICY IF EXISTS "img_insert" ON storage.objects;
  DROP POLICY IF EXISTS "img_update" ON storage.objects;
  DROP POLICY IF EXISTS "img_delete" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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

-- Housekeeping with CODE
CREATE TABLE housekeeping_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rating linked to CODE
CREATE TABLE housekeeping_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (open for testing)
-- ============================================

ALTER TABLE minibar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON minibar_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON services FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON tours FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON rules FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON translations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE housekeeping_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON housekeeping_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE housekeeping_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON housekeeping_ratings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "img_select" ON storage.objects FOR SELECT USING (bucket_id = 'images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "img_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "img_update" ON storage.objects FOR UPDATE USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "img_delete" ON storage.objects FOR DELETE USING (bucket_id = 'images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DONE!
