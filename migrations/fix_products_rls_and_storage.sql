-- Fix RLS policies for products table
-- First, let's check if the policies exist and drop them if they do
DO $$
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Farmers can insert their own products') THEN
        DROP POLICY "Farmers can insert their own products" ON products;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Farmers can update their own products') THEN
        DROP POLICY "Farmers can update their own products" ON products;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Farmers can delete their own products') THEN
        DROP POLICY "Farmers can delete their own products" ON products;
    END IF;
END
$$;

-- Create new policies with proper conditions
-- Policy for farmers to insert their own products
CREATE POLICY "Farmers can insert their own products" ON products
    FOR INSERT
    WITH CHECK (
        (farmer_id IS NULL OR farmer_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (vendor_id IS NULL OR vendor_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (owner_id IS NULL OR owner_id::text = current_setting('request.jwt.claim.sub', true))
    );

-- Policy for farmers to update their own products
CREATE POLICY "Farmers can update their own products" ON products
    FOR UPDATE
    USING (
        (farmer_id IS NULL OR farmer_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (vendor_id IS NULL OR vendor_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (owner_id IS NULL OR owner_id::text = current_setting('request.jwt.claim.sub', true))
    )
    WITH CHECK (
        (farmer_id IS NULL OR farmer_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (vendor_id IS NULL OR vendor_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (owner_id IS NULL OR owner_id::text = current_setting('request.jwt.claim.sub', true))
    );

-- Policy for farmers to delete their own products
CREATE POLICY "Farmers can delete their own products" ON products
    FOR DELETE
    USING (
        (farmer_id IS NULL OR farmer_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (vendor_id IS NULL OR vendor_id::text = current_setting('request.jwt.claim.sub', true)) OR
        (owner_id IS NULL OR owner_id::text = current_setting('request.jwt.claim.sub', true))
    );

-- Fix storage permissions for product_images bucket
-- This requires using the Supabase dashboard to update storage bucket policies
-- Instructions for manual update:
-- 1. Go to Storage in Supabase dashboard
-- 2. Select the 'products' bucket
-- 3. Go to Policies tab
-- 4. Update or create INSERT policy with the following condition:
--    (role() = 'authenticated')
-- 5. Update or create SELECT policy to allow public access with:
--    (role() = 'anon' OR role() = 'authenticated')
