-- Add all missing columns to products table
-- This is a combined migration that adds multiple columns needed by the application

DO $$ 
BEGIN
  -- Add additional_images column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'additional_images'
  ) THEN
    ALTER TABLE products ADD COLUMN additional_images TEXT[];
    COMMENT ON COLUMN products.additional_images IS 'Array of URLs for additional product images beyond the primary image_url';
  END IF;

  -- Add is_available column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE products ADD COLUMN is_available BOOLEAN DEFAULT true;
    COMMENT ON COLUMN products.is_available IS 'Indicates if the product is currently available for purchase';
  END IF;

  -- Add min_order_quantity column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_order_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN min_order_quantity INTEGER DEFAULT 1;
    COMMENT ON COLUMN products.min_order_quantity IS 'Minimum quantity that can be ordered for this product';
  END IF;

  -- Add region_of_origin column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'region_of_origin'
  ) THEN
    ALTER TABLE products ADD COLUMN region_of_origin TEXT;
    COMMENT ON COLUMN products.region_of_origin IS 'Geographical region where the product was grown or produced';
  END IF;

  -- Add storage_instructions column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'storage_instructions'
  ) THEN
    ALTER TABLE products ADD COLUMN storage_instructions TEXT;
    COMMENT ON COLUMN products.storage_instructions IS 'Instructions for properly storing the product to maintain freshness';
  END IF;

  -- Add is_deleted column if it doesn't exist (for soft delete functionality)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE products ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    COMMENT ON COLUMN products.is_deleted IS 'Flag indicating if the product has been soft-deleted';
  END IF;
  
  -- Add views_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE products ADD COLUMN views_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN products.views_count IS 'Counter for product page views';
  END IF;
END $$; 