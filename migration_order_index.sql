-- ============================================
-- MIGRATION: Add order_index column for drag-and-drop sorting
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. Add column to ALL orderable tables
ALTER TABLE minibar_items ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE hot_deals ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Populate order_index based on existing created_at order
-- This ensures existing items get sequential indices (1, 2, 3...)
-- so they don't all start at 0 which would make sorting unpredictable.

-- Minibar Items
WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM minibar_items
)
UPDATE minibar_items SET order_index = cte.rn FROM cte WHERE minibar_items.id = cte.id;

-- Services
WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM services
)
UPDATE services SET order_index = cte.rn FROM cte WHERE services.id = cte.id;

-- Tours
WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM tours
)
UPDATE tours SET order_index = cte.rn FROM cte WHERE tours.id = cte.id;

-- Rules
WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM rules
)
UPDATE rules SET order_index = cte.rn FROM cte WHERE rules.id = cte.id;

-- Translations
WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM translations
)
UPDATE translations SET order_index = cte.rn FROM cte WHERE translations.id = cte.id;

-- Hot Deals (includes both discounts and announcements)
WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM hot_deals
)
UPDATE hot_deals SET order_index = cte.rn FROM cte WHERE hot_deals.id = cte.id;

-- Done! All existing items now have sequential order_index values.
-- The admin panel drag-and-drop will manage these going forward.
