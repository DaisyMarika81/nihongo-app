-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Creates a table for per-session notes that sync to cloud

CREATE TABLE IF NOT EXISTS schedule_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_num INT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public access (same as session_data pattern)
ALTER TABLE schedule_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON schedule_notes FOR ALL USING (true) WITH CHECK (true);
