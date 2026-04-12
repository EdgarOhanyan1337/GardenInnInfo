-- ============================================
-- MIGRATION: Add order_index column for drag-and-drop sorting
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. Add column to all orderable tables
ALTER TABLE minibar_items ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Populate order_index based on existing created_at order
-- This ensures existing items get sequential indices (1, 2, 3...)
-- so they don't all start at 0 which would make sorting unpredictable.

WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM minibar_items
)
UPDATE minibar_items SET order_index = cte.rn FROM cte WHERE minibar_items.id = cte.id;

WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM services
)
UPDATE services SET order_index = cte.rn FROM cte WHERE services.id = cte.id;

WITH cte AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM tours
)
UPDATE tours SET order_index = cte.rn FROM cte WHERE tours.id = cte.id;

-- Done! Existing items now have sequential order_index values.
-- The admin panel drag-and-drop will manage these going forward.
