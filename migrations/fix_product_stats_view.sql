-- Fix product_stats view to allow inserts
-- This migration adds an INSTEAD OF INSERT trigger to make the view updatable

-- First, let's create the trigger function
CREATE OR REPLACE FUNCTION insert_into_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- If the product already exists in the base 'products' table
  IF EXISTS (SELECT 1 FROM products WHERE id = NEW.id) THEN
    -- Update existing product stats fields
    UPDATE products 
    SET 
      sales_count = COALESCE(NEW.sales_count, 0),
      inventory_count = COALESCE(NEW.inventory_count, 0),
      featured = COALESCE(NEW.featured, false)
    WHERE id = NEW.id;
  ELSE
    -- Insert a new minimal product record
    INSERT INTO products (
      id, 
      name, 
      category_id, 
      sales_count, 
      inventory_count, 
      featured
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.category_id,
      COALESCE(NEW.sales_count, 0),
      COALESCE(NEW.inventory_count, 0),
      COALESCE(NEW.featured, false)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists before trying to create it
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS insert_product_stats_trigger ON product_stats;

  -- Create the INSTEAD OF INSERT trigger
  CREATE TRIGGER insert_product_stats_trigger
  INSTEAD OF INSERT ON product_stats
  FOR EACH ROW
  EXECUTE FUNCTION insert_into_product_stats();
  
  RAISE NOTICE 'Product stats trigger created successfully';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'product_stats view does not exist, skipping trigger creation';
  WHEN others THEN
    RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END $$; 