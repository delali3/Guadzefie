-- Add region_of_origin column to products table
-- This column stores the geographical region where the product originates from

DO $$ 
BEGIN
  -- Check if the region_of_origin column doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'region_of_origin'
  ) THEN
    -- Add the region_of_origin column as text
    ALTER TABLE products ADD COLUMN region_of_origin TEXT;
  END IF;
END $$;

-- Add a comment to the column for documentation
COMMENT ON COLUMN products.region_of_origin IS 'Geographical region where the product was grown or produced'; 