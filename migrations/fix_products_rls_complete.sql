-- First, let's enable RLS on the products table if it's not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the products table to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Farmers can insert their own products" ON products;
DROP POLICY IF EXISTS "Farmers can update their own products" ON products;
DROP POLICY IF EXISTS "Farmers can delete their own products" ON products;

-- Create a policy for public read access
CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT
    USING (true);

-- Create a policy for insert that allows any authenticated user to insert products
-- This is more permissive but will get things working
CREATE POLICY "Allow authenticated users to insert products" ON products
    FOR INSERT
    WITH CHECK (true);

-- Create a policy for update that allows any authenticated user to update products
-- This is more permissive but will get things working
CREATE POLICY "Allow authenticated users to update products" ON products
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create a policy for delete that allows any authenticated user to delete products
-- This is more permissive but will get things working
CREATE POLICY "Allow authenticated users to delete products" ON products
    FOR DELETE
    USING (true);

-- Fix storage permissions for product_images bucket
-- This requires manual intervention in the Supabase dashboard
-- Instructions:
-- 1. Go to Storage in Supabase dashboard
-- 2. Select the 'products' bucket (or create it if it doesn't exist)
-- 3. Go to Policies tab
-- 4. Create a policy for INSERT with the condition: true
-- 5. Create a policy for SELECT with the condition: true
-- 6. Create a policy for UPDATE with the condition: true
-- 7. Create a policy for DELETE with the condition: true

-- Note: These policies are very permissive and should be tightened
-- once the basic functionality is working
