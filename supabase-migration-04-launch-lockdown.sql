-- Migration 04: launch lockdown
-- Run in the Supabase SQL Editor AFTER migrations 01, 02 and 03 (needs is_admin() from 01).
-- Safe to re-run.
--
-- BEFORE running: make sure your own account is promoted to admin (step 6 of
-- migration 01). After this migration only an admin account can add, edit or
-- delete schools, and only an admin can read the school-submission inbox.

-- ============================================================
-- 1. Schools: public read, admin-only write
--    Drops every historical write policy (they all allowed the public key).
-- ============================================================
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schools' AND cmd <> 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.schools', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can insert schools" ON schools
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update schools" ON schools
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete schools" ON schools
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- 2. School submissions: anyone can submit, only admins can read or change
--    (the inbox holds contact names and emails)
-- ============================================================
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'school_submissions'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.school_submissions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can submit a school" ON school_submissions
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Admins can view submissions" ON school_submissions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update submissions" ON school_submissions
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 3. Remove the seeded sample reviews
--    (inserted by supabase-sample-reviews.sql and supabase-lighthouse-reviews.sql
--    with placeholder @example.com addresses; they are not from real parents)
-- ============================================================
DELETE FROM reviews WHERE user_email LIKE 'parent%@example.com';

-- ============================================================
-- 4. Stop exposing reviewer emails
--    Approved reviews are publicly readable, so the email column must stay empty.
--    The trigger blanks it on every write, whatever the page sends. The author's
--    email is still available to admins through user_profiles (via user_id).
-- ============================================================
ALTER TABLE reviews ALTER COLUMN user_email DROP NOT NULL;
UPDATE reviews SET user_email = NULL WHERE user_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reviews_strip_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.user_email := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_strip_email ON reviews;
CREATE TRIGGER reviews_strip_email
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_strip_email();

-- ============================================================
-- 5. Data fix: dead stock photo on American Youth Academy
-- ============================================================
UPDATE schools SET photo_url = NULL
WHERE photo_url LIKE '%photo-1523050854058-8df90110c9f1%';
