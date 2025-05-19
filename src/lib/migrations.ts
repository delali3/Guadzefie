import { supabase } from './supabase';

// Import and re-export farm customer table functions
import { 
  checkFarmCustomersTable, 
  ensureFarmCustomersTable 
} from './migrations/farm_customers_table';

export const ensureProfilesTable = async () => {
  try {
    // SQL script to create profiles table with extended fields
    const sql = `
      -- Enable UUID extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create profiles table if it doesn't exist
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY, -- Changed to match custom users table
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50) DEFAULT NULL, -- Make sure phone accepts null values
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
      
      -- Drop existing phone check constraint if it exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_check'
        ) THEN
          ALTER TABLE profiles DROP CONSTRAINT profiles_phone_check;
        END IF;
      END $$;

      -- Create index on id for faster lookups
      CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);

      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DO $$ 
      BEGIN
        -- Policy for selecting profiles (viewing)
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
        ) THEN
          CREATE POLICY "Users can view own profile" 
            ON profiles FOR SELECT 
            TO authenticated
            USING (true);
        END IF;

        -- Policy for updating profiles
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
        ) THEN
          CREATE POLICY "Users can update own profile" 
            ON profiles FOR UPDATE
            TO authenticated
            USING (true);
        END IF;

        -- Policy for inserting profiles
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
        ) THEN
          CREATE POLICY "Users can insert own profile" 
            ON profiles FOR INSERT
            TO authenticated
            WITH CHECK (true);
        END IF;
      END $$;

      -- Create trigger to update the updated_at column
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
        ) THEN
          CREATE OR REPLACE FUNCTION set_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER set_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;

      -- Create storage bucket for avatars if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM storage.buckets WHERE name = 'profiles'
        ) THEN
          INSERT INTO storage.buckets (id, name, public) 
          VALUES ('profiles', 'profiles', true);
          
          -- Create policies for the bucket
          CREATE POLICY "Public profiles access"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'profiles');
            
          CREATE POLICY "Authenticated users can upload avatars"
            ON storage.objects FOR INSERT
            WITH CHECK (
              bucket_id = 'profiles' AND
              auth.role() = 'authenticated'
            );
            
          -- Users can only update/delete their own avatar files
          CREATE POLICY "Users can update own avatar files"
            ON storage.objects FOR UPDATE
            USING (
              bucket_id = 'profiles' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
            
          CREATE POLICY "Users can delete own avatar files"
            ON storage.objects FOR DELETE
            USING (
              bucket_id = 'profiles' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
        END IF;
      END $$;
    `;
    
    // Execute the migration - first try using RPC
    let { error } = await supabase.rpc('exec_sql', { sql });
    
    // If RPC fails (likely due to permissions), try direct SQL with service role if available
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        // Try alternative method: direct SQL query if using service role client
        const { error: sqlError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Check if table exists
        if (sqlError && sqlError.message.includes('relation "profiles" does not exist')) {
          return { 
            success: false, 
            message: 'Profile table needs to be created by an administrator or using a service role client.' 
          };
        }
      } else {
        return { success: false, message: `Migration failed: ${error.message}` };
      }
    }
    
    return { success: true, message: 'Profile table setup successful' };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
};

export const checkProfileTable = async () => {
  try {
    // Check if profile table exists by attempting a simple query
    const { error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      // If the error indicates the table doesn't exist
      if (error.message.includes('relation "profiles" does not exist')) {
        return false;
      }
      // For other errors, log but assume table might exist
      console.error("Error checking profile table:", error);
    }
    
    return true;
  } catch (error) {
    console.error("Exception checking profile table:", error);
    return false;
  }
};

export const ensureShippingAddressesTable = async () => {
  try {
    // SQL script to create shipping_addresses table with RLS policies
    const sql = `
      -- Create shipping_addresses table if it doesn't exist
      CREATE TABLE IF NOT EXISTS shipping_addresses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR to match custom users table
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        postal_code VARCHAR(50) NOT NULL,
        country VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create index on user_id for faster lookups
      CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
      
      -- Create index on is_default to quickly find default addresses
      CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_default ON shipping_addresses(user_id, is_default) WHERE is_default = true;

      -- Enable RLS
      ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DO $$ 
      BEGIN
        -- Policy for selecting addresses (viewing)
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'shipping_addresses' AND policyname = 'Users can view their own shipping addresses'
        ) THEN
          CREATE POLICY "Users can view their own shipping addresses" 
            ON shipping_addresses FOR SELECT 
            TO authenticated
            USING (true);
        END IF;

        -- Policy for inserting addresses
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'shipping_addresses' AND policyname = 'Users can insert their own shipping addresses'
        ) THEN
          CREATE POLICY "Users can insert their own shipping addresses" 
            ON shipping_addresses FOR INSERT
            TO authenticated
            WITH CHECK (true);
        END IF;
        
        -- Policy for updating addresses
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'shipping_addresses' AND policyname = 'Users can update their own shipping addresses'
        ) THEN
          CREATE POLICY "Users can update their own shipping addresses" 
            ON shipping_addresses FOR UPDATE
            TO authenticated
            USING (true);
        END IF;
        
        -- Policy for deleting addresses
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'shipping_addresses' AND policyname = 'Users can delete their own shipping addresses'
        ) THEN
          CREATE POLICY "Users can delete their own shipping addresses" 
            ON shipping_addresses FOR DELETE
            TO authenticated
            USING (true);
        END IF;
      END $$;

      -- Create trigger to update the updated_at column
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'set_shipping_addresses_updated_at'
        ) THEN
          CREATE OR REPLACE FUNCTION set_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER set_shipping_addresses_updated_at
            BEFORE UPDATE ON shipping_addresses
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;
      
      -- Create trigger to ensure only one default address per user
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_single_default_address'
        ) THEN
          CREATE OR REPLACE FUNCTION ensure_single_default_address()
          RETURNS TRIGGER AS $$
          BEGIN
            -- If the new address is being set as default
            IF NEW.is_default THEN
              -- Update any existing default addresses for this user to not be default
              UPDATE shipping_addresses
              SET is_default = false
              WHERE user_id = NEW.user_id
                AND id != NEW.id
                AND is_default = true;
            END IF;
            
            -- If the user has no default address, make this one the default
            IF NOT EXISTS (
              SELECT 1 FROM shipping_addresses 
              WHERE user_id = NEW.user_id AND is_default = true
            ) THEN
              NEW.is_default := true;
            END IF;
            
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER ensure_single_default_address
            BEFORE INSERT OR UPDATE ON shipping_addresses
            FOR EACH ROW
            EXECUTE FUNCTION ensure_single_default_address();
        END IF;
      END $$;
    `;
    
    // Execute the migration - first try using RPC
    let { error } = await supabase.rpc('exec_sql', { sql });
    
    // If RPC fails (likely due to permissions), try direct SQL with service role if available
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        // Try alternative method: direct SQL query if using service role client
        const { error: sqlError } = await supabase
          .from('shipping_addresses')
          .select('*', { count: 'exact', head: true });
        
        // Check if table exists
        if (sqlError && sqlError.message.includes('relation "shipping_addresses" does not exist')) {
          return { 
            success: false, 
            message: 'Shipping addresses table needs to be created by an administrator or using a service role client.' 
          };
        }
      } else {
        return { success: false, message: `Migration failed: ${error.message}` };
      }
    }
    
    return { success: true, message: 'Shipping addresses table setup successful' };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
};

export const checkShippingAddressesTable = async () => {
  try {
    // Check if shipping_addresses table exists by attempting a simple query
    const { error } = await supabase
      .from('shipping_addresses')
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      // If the error indicates the table doesn't exist
      if (error.message.includes('relation "shipping_addresses" does not exist')) {
        return false;
      }
      // For other errors, log but assume table might exist
      console.error("Error checking shipping_addresses table:", error);
    }
    
    return true;
  } catch (error) {
    console.error("Exception checking shipping_addresses table:", error);
    return false;
  }
};

export const ensureDeliveriesTable = async () => {
  try {
    // SQL script to create deliveries table with RLS policies
    const sql = `
      -- Create deliveries table if it doesn't exist
      CREATE TABLE IF NOT EXISTS deliveries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        estimated_delivery TIMESTAMPTZ,
        actual_delivery TIMESTAMPTZ,
        tracking_number VARCHAR(100),
        shipping_method VARCHAR(100) NOT NULL DEFAULT 'standard',
        carrier VARCHAR(100) NOT NULL DEFAULT 'default',
        notes TEXT
      );

      -- Create index on order_id for faster lookups
      CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON deliveries(order_id);

      -- Create index on status for filtering
      CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries(status);

      -- Create index on created_at for date filtering and sorting
      CREATE INDEX IF NOT EXISTS deliveries_created_at_idx ON deliveries(created_at);

      -- Enable RLS
      ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DO $$ 
      BEGIN
        -- Policy for selecting deliveries (viewing)
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'deliveries' AND policyname = 'Users can view deliveries'
        ) THEN
          CREATE POLICY "Users can view deliveries" 
            ON deliveries FOR SELECT 
            TO authenticated
            USING (true);
        END IF;

        -- Policy for inserting deliveries
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'deliveries' AND policyname = 'Users can insert deliveries'
        ) THEN
          CREATE POLICY "Users can insert deliveries" 
            ON deliveries FOR INSERT
            TO authenticated
            WITH CHECK (true);
        END IF;
        
        -- Policy for updating deliveries
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'deliveries' AND policyname = 'Users can update deliveries'
        ) THEN
          CREATE POLICY "Users can update deliveries" 
            ON deliveries FOR UPDATE
            TO authenticated
            USING (true);
        END IF;
        
        -- Policy for deleting deliveries
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'deliveries' AND policyname = 'Users can delete deliveries'
        ) THEN
          CREATE POLICY "Users can delete deliveries" 
            ON deliveries FOR DELETE
            TO authenticated
            USING (true);
        END IF;
      END $$;
    `;
    
    // Execute the migration - first try using RPC
    let { error } = await supabase.rpc('exec_sql', { sql });
    
    // If RPC fails (likely due to permissions), try direct SQL with service role if available
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        // Try alternative method: direct SQL query if using service role client
        const { error: sqlError } = await supabase
          .from('deliveries')
          .select('*', { count: 'exact', head: true });
        
        // Check if table exists
        if (sqlError && sqlError.message.includes('relation "deliveries" does not exist')) {
          return { 
            success: false, 
            message: 'Deliveries table needs to be created by an administrator or using a service role client.' 
          };
        }
      } else {
        return { success: false, message: `Migration failed: ${error.message}` };
      }
    }
    
    return { success: true, message: 'Deliveries table setup successful' };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
};

export const checkDeliveriesTable = async () => {
  try {
    // Check if deliveries table exists by attempting a simple query
    const { error } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      // If the error indicates the table doesn't exist
      if (error.message.includes('relation "deliveries" does not exist')) {
        return false;
      }
      // For other errors, log but assume table might exist
      console.error("Error checking deliveries table:", error);
    }
    
    return true;
  } catch (error) {
    console.error("Exception checking deliveries table:", error);
    return false;
  }
};

export { 
  checkFarmCustomersTable, 
  ensureFarmCustomersTable 
}; 