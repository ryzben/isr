-- Checks for migration 06. Read-only. Run AFTER supabase-migration-06-school-photos.sql.
-- Expected: every row says PASS.
SELECT 1 AS n, 'photos column exists, jsonb, default []' AS test,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'schools'
                      AND column_name = 'photos' AND data_type = 'jsonb'
                      AND column_default LIKE '''[]''::jsonb%')
       THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 2, 'shape constraint present (array, max 3)',
  CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schools_photos_shape')
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 3, 'Arqams Academy has 3 photos, logo first and flagged',
  CASE WHEN (SELECT jsonb_array_length(photos) = 3
                AND photos->0->>'url' LIKE '%1795530899327_1.jpg'
                AND (photos->0->>'logo')::boolean
                AND photo_url = photos->0->>'url'
             FROM schools WHERE id = 'arqams-academy')
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 4, 'no other school was changed (all others still [])',
  CASE WHEN NOT EXISTS (SELECT 1 FROM schools WHERE id <> 'arqams-academy' AND photos <> '[]'::jsonb)
       THEN 'PASS' ELSE 'FAIL' END
ORDER BY 1;
