-- Add farmer_id column to products table
ALTER TABLE products ADD COLUMN farmer_id UUID REFERENCES users(id);

-- Add vendor_id column to products table (as a fallback option seen in the code)
ALTER TABLE products ADD COLUMN vendor_id UUID REFERENCES users(id);

-- Add owner_id column to products table (as a fallback option seen in the code)
ALTER TABLE products ADD COLUMN owner_id UUID REFERENCES users(id);

-- Add indexes for better query performance
CREATE INDEX idx_products_farmer_id ON products(farmer_id);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_owner_id ON products(owner_id);

-- Update the RLS policies to include these new columns
ALTER POLICY "Enable read access for all users" ON products
    USING (true);

-- Policy for farmers to manage their own products
CREATE POLICY "Farmers can insert their own products" ON products
    FOR INSERT
    WITH CHECK (current_setting('request.jwt.claim.sub', true) = farmer_id::text OR current_setting('request.jwt.claim.sub', true) = vendor_id::text OR current_setting('request.jwt.claim.sub', true) = owner_id::text);

CREATE POLICY "Farmers can update their own products" ON products
    FOR UPDATE
    USING (current_setting('request.jwt.claim.sub', true) = farmer_id::text OR current_setting('request.jwt.claim.sub', true) = vendor_id::text OR current_setting('request.jwt.claim.sub', true) = owner_id::text)
    WITH CHECK (current_setting('request.jwt.claim.sub', true) = farmer_id::text OR current_setting('request.jwt.claim.sub', true) = vendor_id::text OR current_setting('request.jwt.claim.sub', true) = owner_id::text);

CREATE POLICY "Farmers can delete their own products" ON products
    FOR DELETE
    USING (current_setting('request.jwt.claim.sub', true) = farmer_id::text OR current_setting('request.jwt.claim.sub', true) = vendor_id::text OR current_setting('request.jwt.claim.sub', true) = owner_id::text);
