-- Migration script to create user_settings table if it doesn't exist
-- This table stores user preferences and settings

-- Check if user_settings table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        -- Create user_settings table
        CREATE TABLE user_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            email_notifications BOOLEAN DEFAULT TRUE,
            order_updates BOOLEAN DEFAULT TRUE,
            marketing_emails BOOLEAN DEFAULT FALSE,
            dark_mode_preference VARCHAR(10) DEFAULT 'system',
            language_preference VARCHAR(5) DEFAULT 'en',
            privacy_setting VARCHAR(20) DEFAULT 'private',
            two_factor_auth BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id)
        );

        -- Create RLS policies for user_settings table
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

        -- Users can only read their own settings
        CREATE POLICY "Users can view their own settings"
        ON user_settings FOR SELECT
        USING (auth.uid() = user_id);

        -- Users can only update their own settings
        CREATE POLICY "Users can update their own settings"
        ON user_settings FOR UPDATE
        USING (auth.uid() = user_id);

        -- Users can insert their own settings
        CREATE POLICY "Users can insert their own settings"
        ON user_settings FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        -- Create stored procedure for client-side creation
        CREATE OR REPLACE FUNCTION create_settings_table_if_not_exists()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            -- Code is empty as the main migration handles this
            -- This is just a placeholder for client-side calls
            NULL;
        END;
        $$;

        RAISE NOTICE 'Created user_settings table and policies';
    ELSE
        RAISE NOTICE 'user_settings table already exists';
    END IF;
END $$; 