-- Fix farmra_user table schema for Supabase Auth
-- Remove password_hash column and fix user_id reference

-- First, drop existing table if it exists
DROP TABLE IF EXISTS farmra_user CASCADE;

-- Recreate with correct schema
CREATE TABLE farmra_user (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role_id INTEGER REFERENCES user_role(role_id)
);

-- Create indexes for better performance
CREATE INDEX idx_farmra_user_email ON farmra_user(email);
CREATE INDEX idx_farmra_user_role_id ON farmra_user(role_id);

-- Enable Row Level Security
ALTER TABLE farmra_user ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON farmra_user
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON farmra_user
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON farmra_user
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow technicians to view all farmer profiles
CREATE POLICY "Technicians can view farmer profiles" ON farmra_user
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM farmra_user u
      WHERE u.user_id = auth.uid() AND u.role_id = 1
    )
  );