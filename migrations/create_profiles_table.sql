-- Migration script to create profiles table if it doesn't exist
-- This table stores user profile information with extended fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if profiles table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Create profiles table with extended fields
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(50),
      avatar_url TEXT,
      bio TEXT,
      birth_date DATE,
      gender VARCHAR(50),
      occupation VARCHAR(255),
      address JSONB,
      website VARCHAR(255),
      social_links JSONB,
      privacy_level VARCHAR(20) DEFAULT 'private',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create index on id for faster lookups
    CREATE INDEX idx_profiles_user_id ON profiles(id);

    -- Enable Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies for profiles table
    -- Users can only read their own profile
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

    -- Users can only update their own profile
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);

    -- Users can insert their own profile
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

    -- Create trigger to update the updated_at column
    CREATE OR REPLACE FUNCTION update_profiles_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER profiles_updated_at_trigger
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_profiles_updated_at();

    -- Create profiles storage bucket if it doesn't exist
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'profiles') THEN
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('profiles', 'profiles', true);
    END IF;

    -- Create storage policies for profile avatars
    -- Public read access for avatars
    CREATE POLICY "Public profiles access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'profiles');

    -- Only authenticated users can upload avatars
    CREATE POLICY "Authenticated users can upload avatars"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'profiles' AND
        auth.role() = 'authenticated'
      );

    -- Users can only update their own avatar files
    CREATE POLICY "Users can update own avatar files"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'profiles' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    -- Users can only delete their own avatar files
    CREATE POLICY "Users can delete own avatar files"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'profiles' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
      
    -- Insert a function to format social profile links properly
    CREATE OR REPLACE FUNCTION format_social_link(link TEXT, platform TEXT)
    RETURNS TEXT AS $$
    BEGIN
      IF link IS NULL OR link = '' THEN
        RETURN '';
      END IF;
      
      -- Remove http/https if already present
      link := regexp_replace(link, '^https?://', '');
      
      -- Add platform prefix if not already there
      IF NOT link LIKE platform || '%' THEN
        link := platform || '/' || link;
      END IF;
      
      -- Add https protocol
      RETURN 'https://' || link;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$; 