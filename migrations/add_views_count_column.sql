-- Add views_count column to products table
-- This column tracks the number of times a product has been viewed

DO $$ 
BEGIN
  -- Check if the views_count column doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'views_count'
  ) THEN
    -- Add the views_count column with DEFAULT 0
    ALTER TABLE products ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add a comment to the column for documentation
COMMENT ON COLUMN products.views_count IS 'Counter for product page views'; 