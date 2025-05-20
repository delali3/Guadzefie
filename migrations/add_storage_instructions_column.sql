-- Add storage_instructions column to products table
-- This column stores information about how to properly store the product

DO $$ 
BEGIN
  -- Check if the storage_instructions column doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'storage_instructions'
  ) THEN
    -- Add the storage_instructions column as text
    ALTER TABLE products ADD COLUMN storage_instructions TEXT;
  END IF;
END $$;

-- Add a comment to the column for documentation
COMMENT ON COLUMN products.storage_instructions IS 'Instructions for properly storing the product to maintain freshness'; 