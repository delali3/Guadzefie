-- Add min_order_quantity column to products table
-- This column sets the minimum quantity a customer can order for a product

DO $$ 
BEGIN
  -- Check if the min_order_quantity column doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_order_quantity'
  ) THEN
    -- Add the min_order_quantity column with DEFAULT 1
    ALTER TABLE products ADD COLUMN min_order_quantity INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add a comment to the column for documentation
COMMENT ON COLUMN products.min_order_quantity IS 'Minimum quantity that can be ordered for this product'; 