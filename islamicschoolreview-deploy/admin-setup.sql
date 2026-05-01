-- Admin Approval System Setup
-- Run this in Supabase SQL Editor

-- 1. Create admin_users table to track admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Only admins can view admin_users table
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE is_admin = true));

-- 4. Update schools table RLS for status updates
-- Allow only authenticated admins to update school status
CREATE POLICY "Admins can approve schools"
  ON schools
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE is_admin = true));

-- 5. Allow admins to delete schools
CREATE POLICY "Admins can delete schools"
  ON schools
  FOR DELETE
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE is_admin = true));

-- 6. Insert your admin email here
-- Replace 'your-admin-email@example.com' with your actual email
-- NOTE: First sign up through the admin.html page, then run this:
-- INSERT INTO admin_users (id, email, is_admin) 
-- SELECT id, email, true FROM auth.users WHERE email = 'your-admin-email@example.com';
