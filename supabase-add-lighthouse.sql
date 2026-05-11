-- Add The Lighthouse Schools + restore anon INSERT policy for admin dashboard
-- Run in Supabase SQL Editor

-- Restore INSERT policy so admin dashboard can publish schools
CREATE POLICY IF NOT EXISTS "Admin can insert schools"
  ON schools FOR INSERT
  WITH CHECK (true);

-- Add The Lighthouse Schools
INSERT INTO schools (id, name, city, state, address, phone, website, grades, description, photo_url, verified)
VALUES (
  'the-lighthouse-schools',
  'The Lighthouse Schools',
  'Clinton',
  'IA',
  '400 N Bluff Blvd, Clinton, IA 52732',
  '(563) 249-4566',
  'https://tlhschools.org',
  'Grades 6-12',
  'An innovative Islamic boarding school in Clinton, Iowa that merges rigorous academics with strong Islamic values and character development. Brotherhood. Discipline. Purpose. ESA Tuition Assistance available.',
  'https://tlhschools.org/wp-content/uploads/2023/04/campus-thelighthouse-schools-3-700x450.jpg',
  false
)
ON CONFLICT (id) DO NOTHING;
