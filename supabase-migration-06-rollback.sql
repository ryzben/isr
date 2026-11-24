-- Rollback for supabase-migration-06-school-photos.sql
-- WARNING: deletes every school's photo list (photos 2 and 3, alt text and
-- logo flags). Each school's cover stays in photo_url, so directory cards
-- and pages keep one photo. Copy the lists first if you want them:
--   SELECT id, photos FROM schools WHERE photos <> '[]'::jsonb;
-- Also redeploy an admin.html without the photo manager, or saving a school
-- in /admin will fail with "column photos does not exist".
ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_photos_shape;
ALTER TABLE public.schools DROP COLUMN IF EXISTS photos;
