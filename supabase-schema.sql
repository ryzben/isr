-- IslamicSchoolReview.com Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Schools table (migrated from schools.json)
CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  grades TEXT,
  tuition_range TEXT,
  description TEXT,
  photo_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  accreditation TEXT,
  enrollment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table (parent reviews)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Firebase Auth user ID
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  verified_parent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Firebase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'school_admin', 'site_admin')),
  school_id TEXT REFERENCES schools(id), -- for school admins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact form submissions (backup)
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School claim requests
CREATE TABLE school_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  user_role TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_schools_state_city ON schools(state, city);
CREATE INDEX idx_schools_verified ON schools(verified);
CREATE INDEX idx_reviews_school_id ON reviews(school_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_school_claims_school_id ON school_claims(school_id);
CREATE INDEX idx_school_claims_status ON school_claims(status);

-- Row Level Security Policies

-- Schools: Public read access, temporary anon insert for initial import
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools are viewable by everyone" ON schools FOR SELECT USING (true);
-- TEMPORARY: Allow anon inserts for initial data import - REMOVE AFTER IMPORT
CREATE POLICY "Temporary anon insert for import" ON schools FOR INSERT WITH CHECK (true);

-- Reviews: Public read, authenticated write
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

-- Users: Users can read/update their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.jwt() ->> 'sub' = firebase_uid);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.jwt() ->> 'sub' = firebase_uid);

-- Contact submissions: Authenticated users can create
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can submit contact forms" ON contact_submissions FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

-- School claims: Authenticated users can create, admins can read all
ALTER TABLE school_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can create claims" ON school_claims FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);
CREATE POLICY "Admins can view all claims" ON school_claims FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE firebase_uid = auth.jwt() ->> 'sub'
    AND role IN ('school_admin', 'site_admin')
  )
);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_claims_updated_at BEFORE UPDATE ON school_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();