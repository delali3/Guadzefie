-- Migration to add is_admin field to users table
-- This allows for proper role-based access control for admin users

BEGIN;

-- Add is_admin column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
        
        -- Create index for faster queries
        CREATE INDEX idx_users_is_admin ON users(is_admin);
        
        -- Comment for documentation
        COMMENT ON COLUMN users.is_admin IS 'Flag indicating if user has admin privileges';
    END IF;
END $$;

-- Update RLS policies to ensure admins can access all data
-- First, check if the policy exists
DO $$
BEGIN
    -- Policy for admins to read all users
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'users'
        AND policyname = 'Admins can view all users'
    ) THEN
        CREATE POLICY "Admins can view all users"
        ON users
        FOR SELECT
        USING (
            auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
        );
    END IF;

    -- Policy for admins to update all users
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'users'
        AND policyname = 'Admins can update all users'
    ) THEN
        CREATE POLICY "Admins can update all users"
        ON users
        FOR UPDATE
        USING (
            auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
        );
    END IF;
END $$;

-- Create a function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET is_admin = true
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to revoke admin privileges
CREATE OR REPLACE FUNCTION revoke_admin_privileges(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET is_admin = false
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 