-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- User data: progress, SRS cards, settings
CREATE TABLE user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  progress JSONB DEFAULT '{}',
  bookmarks JSONB DEFAULT '[]',
  notes JSONB DEFAULT '{}',
  schedule_notes JSONB DEFAULT '{}',
  kana_mastered JSONB DEFAULT '[]',
  theme TEXT DEFAULT 'light',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own data"
  ON user_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create user_data row on signup
CREATE OR REPLACE FUNCTION create_user_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_data (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_data();
