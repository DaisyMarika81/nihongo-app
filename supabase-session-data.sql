-- Run this in Supabase SQL Editor

-- Session learning data (flashcard, grammar, kanji per session)
-- Single user, no auth needed
CREATE TABLE session_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_num INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flashcard', 'grammar', 'kanji')),
  items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_num, type)
);

-- Disable RLS (single user, no auth)
ALTER TABLE session_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON session_data FOR ALL USING (true) WITH CHECK (true);

-- SRS tracking per session
CREATE TABLE session_srs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_num INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flashcard', 'grammar', 'kanji')),
  cards JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_num, type)
);

ALTER TABLE session_srs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON session_srs FOR ALL USING (true) WITH CHECK (true);
