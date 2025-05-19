-- Migration script to create farm_settings table if it doesn't exist
-- This table stores farm-specific settings and preferences

-- Check if farm_settings table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'farm_settings') THEN
        -- Create farm_settings table
        CREATE TABLE farm_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            farm_name VARCHAR(255) DEFAULT '',
            farm_description TEXT DEFAULT '',
            delivery_radius INTEGER DEFAULT 25,
            minimum_order_amount DECIMAL(10, 2) DEFAULT 15.00,
            free_delivery_amount DECIMAL(10, 2) DEFAULT 50.00,
            order_auto_accept BOOLEAN DEFAULT TRUE,
            tax_rate DECIMAL(5, 2) DEFAULT 0.00,
            show_certification BOOLEAN DEFAULT TRUE,
            allow_pickups BOOLEAN DEFAULT TRUE,
            product_visibility VARCHAR(20) DEFAULT 'public',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(farmer_id)
        );

        -- Create RLS policies for farm_settings table
        ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;

        -- Farmers can only read their own settings
        CREATE POLICY "Farmers can view their own settings"
        ON farm_settings FOR SELECT
        USING (auth.uid() = farmer_id);

        -- Farmers can only update their own settings
        CREATE POLICY "Farmers can update their own settings"
        ON farm_settings FOR UPDATE
        USING (auth.uid() = farmer_id);

        -- Farmers can insert their own settings
        CREATE POLICY "Farmers can insert their own settings"
        ON farm_settings FOR INSERT
        WITH CHECK (auth.uid() = farmer_id);

        -- Create stored procedure for client-side creation
        CREATE OR REPLACE FUNCTION create_farm_settings_table_if_not_exists()
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

        RAISE NOTICE 'Created farm_settings table and policies';
    ELSE
        RAISE NOTICE 'farm_settings table already exists';
    END IF;
END $$; 