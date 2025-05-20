-- Add is_available column to products table
-- This column indicates whether a product is currently available for purchase

DO $$ 
BEGIN
  -- Check if the is_available column doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_available'
  ) THEN
    -- Add the is_available column with DEFAULT true
    ALTER TABLE products ADD COLUMN is_available BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add a comment to the column for documentation
COMMENT ON COLUMN products.is_available IS 'Indicates if the product is currently available for purchase'; 