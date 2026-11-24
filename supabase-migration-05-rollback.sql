-- Rollback for supabase-migration-05-admin-hardening.sql
-- Run in the Supabase SQL Editor only if migration 05 has to be undone.
--
-- State before migration 05 (recorded 24 Nov 2026, just before it was applied):
--   * public.schools had no "programs" column
--   * public.guard_user_type() did not exist
--   * public.user_profiles had no triggers
--   * user_type counts: admin 1, educator 1
-- Migration 05 changed no existing rows, so dropping what it added restores
-- that state exactly.
--
-- WARNING: step 2 deletes any Programs text entered after the migration.
-- Copy it first if you want to keep it:
--   SELECT id, programs FROM schools WHERE programs IS NOT NULL;
-- Also redeploy an admin.html without the Programs field, or saving a school
-- in /admin will fail with "column programs does not exist".

-- 1. Remove the admin-role guard (re-opens the self-promotion hole!)
DROP TRIGGER IF EXISTS guard_user_type ON public.user_profiles;
DROP FUNCTION IF EXISTS public.guard_user_type();

-- 2. Remove the programs column
ALTER TABLE public.schools DROP COLUMN IF EXISTS programs;
