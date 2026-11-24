-- Checks for migration 05. Run AFTER supabase-migration-05-admin-hardening.sql.
-- Changes nothing: each test runs inside its own sub-transaction that is always
-- rolled back. Only a temporary results table (gone when the session ends) is kept.
-- Expected:
--   1  ryzben@gmail.com is admin                 -> PASS
--   2  normal user sets own role to admin        -> PASS (blocked)
--   3  admin saves profile with role "parent"    -> PASS (stays admin)

DROP TABLE IF EXISTS pg_temp.m05_checks;
CREATE TEMP TABLE m05_checks (n int, test text, result text);

DO $$
DECLARE
  admin_id uuid := (SELECT p.id FROM user_profiles p JOIN auth.users u ON u.id = p.id
                    WHERE lower(u.email) = 'ryzben@gmail.com');
  normal_id uuid := (SELECT id FROM user_profiles WHERE user_type <> 'admin' ORDER BY created_at LIMIT 1);
  v text;
BEGIN
  -- 1. Owner account is still admin
  INSERT INTO m05_checks VALUES (1, 'ryzben@gmail.com is admin',
    CASE WHEN (SELECT user_type FROM user_profiles WHERE id = admin_id) = 'admin'
         THEN 'PASS' ELSE 'FAIL' END);

  -- 2. A normal signed-in user tries to make themselves admin (as the API would)
  BEGIN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', normal_id, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE user_profiles SET user_type = 'admin' WHERE id = normal_id RETURNING user_type INTO v;
    RAISE EXCEPTION 'M05_UNDO:%', coalesce(v, 'no row updated');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO m05_checks VALUES (2, 'normal user cannot set own role to admin',
      CASE WHEN SQLERRM LIKE 'M05_UNDO:%' THEN 'FAIL (update went through: ' || substr(SQLERRM, 10) || ')'
           ELSE 'PASS (blocked: ' || SQLERRM || ')' END);
  END;

  -- 3. Admin saves /account with the role picker on "parent"
  BEGIN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE user_profiles SET user_type = 'parent', updated_at = now()
      WHERE id = admin_id RETURNING user_type INTO v;
    RAISE EXCEPTION 'M05_UNDO:%', coalesce(v, 'no row updated');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO m05_checks VALUES (3, 'saving profile keeps admin role',
      CASE WHEN SQLERRM = 'M05_UNDO:admin' THEN 'PASS (role after save: admin; change undone)'
           ELSE 'FAIL (' || SQLERRM || ')' END);
  END;
END $$;

SELECT n, test, result FROM m05_checks ORDER BY n;
