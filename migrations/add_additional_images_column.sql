-- Add additional_images column to products table
-- This column stores the additional images for a product (beyond the primary image_url)

DO $$ 
BEGIN
  -- Check if the additional_images column doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'additional_images'
  ) THEN
    -- Add the additional_images column as a text array
    ALTER TABLE products ADD COLUMN additional_images TEXT[];
    
    -- Optionally, if there's an existing image_urls column we might want to migrate data
    -- But based on the code search, image_urls appears to be used only in the React code, not DB
  END IF;
END $$;

-- Add a comment to the column for documentation
COMMENT ON COLUMN products.additional_images IS 'Array of URLs for additional product images beyond the primary image_url'; 