-- Run this in the Supabase SQL editor to add the school submissions inbox.

CREATE TABLE school_submissions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  school_name  TEXT        NOT NULL,
  city         TEXT        NOT NULL,
  state        TEXT        NOT NULL,
  phone        TEXT,
  website      TEXT,
  description  TEXT,
  contact_name  TEXT       NOT NULL,
  contact_email TEXT       NOT NULL,
  programs     TEXT,
  photo_url_1  TEXT,
  photo_url_2  TEXT,
  photo_url_3  TEXT,
  status       TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected'))
);

ALTER TABLE school_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can INSERT a submission from the add-school form
CREATE POLICY "Anyone can submit a school"
  ON school_submissions FOR INSERT
  WITH CHECK (true);

-- Anyone can SELECT — admin dashboard uses anon key, contact info is self-submitted
CREATE POLICY "Anyone can view submissions"
  ON school_submissions FOR SELECT
  USING (true);

-- Anyone can UPDATE status (admin uses anon key to approve/reject)
CREATE POLICY "Anyone can update submission status"
  ON school_submissions FOR UPDATE
  USING (true);
