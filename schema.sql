-- ============================================
-- Garden Inn Resort — ПОЛНЫЙ ЧИСТЫЙ ЗАПУСК V3
-- Скопируйте ВСЁ в SQL Editor → Run
-- ============================================

-- Удаляем ВСЁ старое
DROP POLICY IF EXISTS "Public read access" ON minibar_items;
DROP POLICY IF EXISTS "Public read minibar" ON minibar_items;
DROP POLICY IF EXISTS "Admin access minibar" ON minibar_items;
DROP POLICY IF EXISTS "Admin full minibar" ON minibar_items;
DROP POLICY IF EXISTS "Full Access" ON minibar_items;

DROP POLICY IF EXISTS "Public read access" ON services;
DROP POLICY IF EXISTS "Public read services" ON services;
DROP POLICY IF EXISTS "Admin access services" ON services;
DROP POLICY IF EXISTS "Admin full services" ON services;
DROP POLICY IF EXISTS "Full Access" ON services;

DROP POLICY IF EXISTS "Public read access" ON tours;
DROP POLICY IF EXISTS "Public read tours" ON tours;
DROP POLICY IF EXISTS "Admin access tours" ON tours;
DROP POLICY IF EXISTS "Admin full tours" ON tours;
DROP POLICY IF EXISTS "Full Access" ON tours;

DROP POLICY IF EXISTS "Public read access" ON rules;
DROP POLICY IF EXISTS "Public read rules" ON rules;
DROP POLICY IF EXISTS "Admin access rules" ON rules;
DROP POLICY IF EXISTS "Admin full rules" ON rules;
DROP POLICY IF EXISTS "Full Access" ON rules;

DROP POLICY IF EXISTS "Public read translations" ON translations;
DROP POLICY IF EXISTS "Admin full translations" ON translations;
DROP POLICY IF EXISTS "Full Access" ON translations;

DROP POLICY IF EXISTS "Public insert housekeeping" ON housekeeping_requests;
DROP POLICY IF EXISTS "Admin access housekeeping" ON housekeeping_requests;
DROP POLICY IF EXISTS "Admin full housekeeping" ON housekeeping_requests;
DROP POLICY IF EXISTS "Full Access" ON housekeeping_requests;

DROP POLICY IF EXISTS "Public insert ratings" ON housekeeping_ratings;
DROP POLICY IF EXISTS "Admin access ratings" ON housekeeping_ratings;
DROP POLICY IF EXISTS "Admin full ratings" ON housekeeping_ratings;
DROP POLICY IF EXISTS "Full Access" ON housekeeping_ratings;

DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Admin Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Storage Delete" ON storage.objects;

DROP TABLE IF EXISTS minibar_items CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS housekeeping_requests CASCADE;
DROP TABLE IF EXISTS housekeeping_ratings CASCADE;

-- ============================================
-- СОЗДАЁМ ТАБЛИЦЫ
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
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status_type TEXT NOT NULL DEFAULT 'free',
  icon TEXT NOT NULL DEFAULT '⭐',
  images JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🗺️',
  images JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT '📋',
  text TEXT NOT NULL,
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
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE housekeeping_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS: ПОЛНЫЙ ДОСТУП (для тестов)
-- Все таблицы: любой может читать, любой аутентифицированный может всё
-- ============================================

ALTER TABLE minibar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON minibar_items FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON minibar_items FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON minibar_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON minibar_items FOR DELETE USING (true);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON services FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON services FOR DELETE USING (true);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON tours FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON tours FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON tours FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON tours FOR DELETE USING (true);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON rules FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON rules FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON rules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON rules FOR DELETE USING (true);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON translations FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON translations FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON translations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON translations FOR DELETE USING (true);

ALTER TABLE housekeeping_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON housekeeping_requests FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON housekeeping_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON housekeeping_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON housekeeping_requests FOR DELETE USING (true);

ALTER TABLE housekeeping_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON housekeeping_ratings FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON housekeeping_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update" ON housekeeping_ratings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone_delete" ON housekeeping_ratings FOR DELETE USING (true);

-- ============================================
-- STORAGE: Корзина для картинок
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- ============================================
-- ГОТОВО! Теперь обновите страницу админки.
-- ============================================
