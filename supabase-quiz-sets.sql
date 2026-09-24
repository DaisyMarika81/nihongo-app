-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Fixes: UPDATE quiz_sets returns 0 rows → "Cannot coerce the result to a single JSON object"
-- App uses local auth (localStorage), not Supabase Auth — need open policies like session_data.

CREATE TABLE IF NOT EXISTS quiz_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quiz_sets ENABLE ROW LEVEL SECURITY;

-- Drop every existing policy on quiz_sets (SELECT-only / auth.uid() policies block writes)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quiz_sets'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quiz_sets', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Allow all"
  ON quiz_sets
  FOR ALL
  USING (true)
  WITH CHECK (true);
