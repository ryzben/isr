-- Migration 03: Favorites (re-assert) + profile preferences
-- Run AFTER migration 01. Safe to re-run.

-- ============================================================
-- 1. user_favorites — ensure table + owner-scoped policies exist
--    (defined in user-auth-setup.sql; re-asserted here so the
--     favorites feature works regardless of which legacy file ran)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites"   ON user_favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON user_favorites;

CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. Profile preferences (account page notification/privacy toggles)
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 3. Ensure signup captures user_type into the profile
--    (handle_new_user previously only copied full_name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.raw_user_meta_data->>'user_type' IN ('parent','student','educator')
        THEN NEW.raw_user_meta_data->>'user_type'
      ELSE 'parent'  -- never allow self-signup as admin
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
