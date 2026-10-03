-- Migration 02: Review helpfulness votes
-- Run AFTER migration 01. Safe to re-run.

-- ============================================================
-- 1. Votes table: one vote per user per review
-- ============================================================
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes are public"            ON review_votes;
DROP POLICY IF EXISTS "Users can vote"              ON review_votes;
DROP POLICY IF EXISTS "Users can remove own vote"   ON review_votes;

-- Public can read votes (needed to show pressed state for the signed-in user;
-- rows contain no PII beyond user ids).
CREATE POLICY "Votes are public" ON review_votes
  FOR SELECT USING (true);

-- Signed-in users vote as themselves, only on approved reviews.
CREATE POLICY "Users can vote" ON review_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.status = 'approved')
  );

CREATE POLICY "Users can remove own vote" ON review_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. Denormalized helpful_count on reviews, maintained by trigger
--    (keeps school-page display a single fetch)
-- ============================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.review_votes_sync_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS review_votes_sync_count ON review_votes;
CREATE TRIGGER review_votes_sync_count
  AFTER INSERT OR DELETE ON review_votes
  FOR EACH ROW EXECUTE FUNCTION public.review_votes_sync_count();

-- Backfill counts in case of any pre-existing votes.
UPDATE reviews r SET helpful_count = sub.c
FROM (SELECT review_id, COUNT(*) c FROM review_votes GROUP BY review_id) sub
WHERE r.id = sub.review_id AND r.helpful_count IS DISTINCT FROM sub.c;
