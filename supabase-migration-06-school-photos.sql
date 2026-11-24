-- Migration 06: up to 3 photos per school
-- Run in the Supabase SQL Editor AFTER migration 05. Safe to re-run.
-- Run it BEFORE deploying the admin.html that saves "photos".
-- Rollback: supabase-migration-06-rollback.sql
--
-- schools.photos is an ordered JSON array of up to 3 objects:
--   [{"url": "https://…", "alt": "Describe the photo", "logo": true}, …]
-- photos[0] is the cover. "logo": true shows the whole image on a white
-- background instead of cropping it to fill the frame.
-- photo_url stays as the cover's URL (directory cards, social previews and
-- older pages read it). /admin keeps the two in sync. Schools with an empty
-- photos array fall back to photo_url, so no other rows need backfilling.

-- ============================================================
-- 1. Column
-- ============================================================
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_photos_shape;
ALTER TABLE public.schools ADD CONSTRAINT schools_photos_shape CHECK (
  jsonb_typeof(photos) = 'array' AND jsonb_array_length(photos) <= 3
);

-- ============================================================
-- 2. Backfill: Arqams Academy gets its 3 submission photos, logo as cover
--    (from its school_submissions row, 24 Nov 2026)
-- ============================================================
UPDATE public.schools
SET photos = jsonb_build_array(
      jsonb_build_object(
        'url',  'https://vprltwjduekabkizlbkv.supabase.co/storage/v1/object/public/school-photos/submissions/1795530899327_1.jpg',
        'alt',  'Arqam''s Academy logo: an open book with three graduates and the motto "Empowering Minds to Empower the World"',
        'logo', true),
      jsonb_build_object(
        'url',  'https://vprltwjduekabkizlbkv.supabase.co/storage/v1/object/public/school-photos/submissions/1795530899345_2.jpg',
        'alt',  'A student reads aloud to classmates seated in the prayer hall'),
      jsonb_build_object(
        'url',  'https://vprltwjduekabkizlbkv.supabase.co/storage/v1/object/public/school-photos/submissions/1795530899345_3.jpg',
        'alt',  'A student and a teacher with a model rocket in a classroom')
    ),
    photo_url = 'https://vprltwjduekabkizlbkv.supabase.co/storage/v1/object/public/school-photos/submissions/1795530899327_1.jpg'
WHERE id = 'arqams-academy';
