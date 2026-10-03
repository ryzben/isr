-- Migration 01: Review moderation + sub-ratings + admin role
-- Run this in the Supabase SQL Editor BEFORE deploying the Phase 4 frontend changes.
-- Safe to re-run (idempotent where possible).

-- ============================================================
-- 1. Moderation status
-- ============================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

DO $$ BEGIN
  ALTER TABLE reviews ADD CONSTRAINT reviews_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: everything that existed before moderation stays publicly visible.
UPDATE reviews SET status = 'approved' WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============================================================
-- 2. Sub-ratings + reviewer context (collected by write-review.html)
-- ============================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_academics     SMALLINT CHECK (rating_academics     BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_islamic       SMALLINT CHECK (rating_islamic       BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_community     SMALLINT CHECK (rating_community     BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_communication SMALLINT CHECK (rating_communication BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_value         SMALLINT CHECK (rating_value         BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_role  TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS years_attended TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS recommend      TEXT CHECK (recommend IN ('yes', 'mixed', 'no'));

-- ============================================================
-- 3. Admin helper: is_admin() checks user_profiles.user_type = 'admin'
--    SECURITY DEFINER because user_profiles RLS only lets users read their own row.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ============================================================
-- 4. Replace reviews policies with moderation-aware ones
--    (drops every historical policy name from both old SQL files)
-- ============================================================
DROP POLICY IF EXISTS "Reviews are viewable by everyone"        ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews"                 ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews"  ON reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews"      ON reviews;

-- SELECT: public sees approved; authors see their own (any status); admins see all.
CREATE POLICY "Approved reviews are public" ON reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Authors can view own reviews" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews" ON reviews
  FOR SELECT USING (public.is_admin());

-- INSERT: signed-in users, only as themselves, only as pending.
CREATE POLICY "Users create own pending reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- UPDATE: authors can edit their own; admins can moderate anything.
CREATE POLICY "Authors can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any review" ON reviews
  FOR UPDATE USING (public.is_admin()) WITH CHECK (true);

-- DELETE: authors may remove their own review; admins may remove any.
CREATE POLICY "Authors can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any review" ON reviews
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- 5. Non-admin edits re-enter moderation
-- ============================================================
CREATE OR REPLACE FUNCTION public.reviews_reset_status_on_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Any content change by the author goes back to the moderation queue.
    IF (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.rating IS DISTINCT FROM OLD.rating) THEN
      NEW.status := 'pending';
    END IF;
    -- Authors can never change their own moderation outcome or verification badge.
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
      NEW.status := OLD.status;
    END IF;
    NEW.verified_parent := OLD.verified_parent;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_reset_status_on_edit ON reviews;
CREATE TRIGGER reviews_reset_status_on_edit
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_reset_status_on_edit();

-- Non-admin INSERTs are forced to safe defaults regardless of client payload.
CREATE OR REPLACE FUNCTION public.reviews_force_defaults_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := 'pending';
    NEW.verified_parent := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_force_defaults_on_insert ON reviews;
CREATE TRIGGER reviews_force_defaults_on_insert
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_force_defaults_on_insert();

-- ============================================================
-- 6. Promote YOUR account to admin (fill in your email, then uncomment & run)
--    The admin dashboard moderation tab requires signing in with this account.
-- ============================================================
-- UPDATE user_profiles SET user_type = 'admin' WHERE email = 'YOUR-EMAIL-HERE';
