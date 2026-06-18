-- ==========================================
-- Supabase Users Table and Auth Sync Trigger
-- ==========================================

-- 1. Create the public.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  department TEXT DEFAULT '인천대학교 학생',
  manner_temp NUMERIC DEFAULT 36.5,
  completed_trades_count INTEGER DEFAULT 0,
  wishlist TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (Allow all reads, but only authenticated updates to own row)
CREATE POLICY "Allow public read access" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Allow update for owners" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert for owners" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create the trigger function to automatically sync new auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, avatar_url, department, manner_temp, completed_trades_count, wishlist)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    '인천대학교 학생',
    36.5,
    0,
    ARRAY[]::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
