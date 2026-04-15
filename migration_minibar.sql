-- ВЫПОЛНИТЕ ЭТОТ СКРИПТ В SUPABASE SQL EDITOR ДЛЯ МИГРАЦИИ
ALTER TABLE minibar_items RENAME COLUMN name TO name_en;
ALTER TABLE minibar_items ADD COLUMN IF NOT EXISTS name_ru TEXT NOT NULL DEFAULT '';
ALTER TABLE minibar_items ADD COLUMN IF NOT EXISTS name_hy TEXT NOT NULL DEFAULT '';
