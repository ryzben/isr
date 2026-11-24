-- Migration 05: admin hardening + programs field
-- Run in the Supabase SQL Editor AFTER migrations 01-04. Safe to re-run.
-- Run it BEFORE deploying the admin.html that saves "programs" (that page
-- writes the new column, and Supabase rejects writes to unknown columns).

-- ============================================================
-- 1. Stop users promoting themselves to admin
-- ============================================================
-- The "Users can update their own profile" policy (and the matching insert
-- policy) only check that the row is yours. They don't restrict which
-- columns you change, so any signed-in user could PATCH their own
-- user_profiles row to user_type = 'admin' and pass every is_admin() check.
-- (Sign-up itself is already safe: handle_new_user() only accepts
-- parent/student/educator from sign-up metadata.)
--
-- For API callers (roles anon/authenticated) this trigger:
--   * refuses to make any row 'admin' (insert or update);
--   * keeps an existing admin as admin. /account has a parent/student/educator
--     role picker that would otherwise demote the admin whenever they saved
--     their profile.
-- Changing between parent/student/educator still works as before.
-- The SQL Editor runs as postgres, so you can still promote or demote by hand:
--   UPDATE user_profiles SET user_type = 'admin' WHERE id = '<user uuid>';
CREATE OR REPLACE FUNCTION public.guard_user_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER          -- so current_user is the API caller's role
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND NEW.user_type = 'admin' THEN
      RAISE EXCEPTION 'user_type admin can only be granted by the site owner'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.user_type = 'admin' AND OLD.user_type IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'user_type admin can only be granted by the site owner'
          USING ERRCODE = '42501';
      END IF;
      IF OLD.user_type = 'admin' THEN
        NEW.user_type := 'admin';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_type ON public.user_profiles;
CREATE TRIGGER guard_user_type
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_type();

-- Check who is admin now (should be only the site owner):
--   SELECT u.email FROM user_profiles p JOIN auth.users u ON u.id = p.id
--   WHERE p.user_type = 'admin';

-- ============================================================
-- 2. Programs offered, editable from /admin and shown on /schools/<slug>
-- ============================================================
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS programs text;
