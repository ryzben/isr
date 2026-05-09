-- Run this in the Supabase SQL editor.
-- Adds UPDATE and DELETE policies to the schools table so the admin
-- dashboard can edit and delete schools using the anon key.

CREATE POLICY "Admin can update schools"
  ON schools FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete schools"
  ON schools FOR DELETE
  USING (true);
