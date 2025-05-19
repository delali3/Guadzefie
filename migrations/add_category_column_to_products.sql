-- Add category column to products table to match the code's expectations
ALTER TABLE products ADD COLUMN category VARCHAR(255);

-- Update the category column with values from categories table based on category_id
UPDATE products
SET category = categories.name
FROM categories
WHERE products.category_id = categories.id;

-- Create index for better query performance
CREATE INDEX idx_products_category ON products(category);

-- Add a trigger to keep category and category_id in sync
CREATE OR REPLACE FUNCTION sync_product_category()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If category_id is set but category is not, update category from categories table
    IF NEW.category_id IS NOT NULL AND NEW.category IS NULL THEN
      NEW.category := (SELECT name FROM categories WHERE id = NEW.category_id);
    -- If category is set but category_id is not, update category_id from categories table
    ELSIF NEW.category IS NOT NULL AND NEW.category_id IS NULL THEN
      NEW.category_id := (SELECT id FROM categories WHERE name = NEW.category LIMIT 1);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_product_category
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION sync_product_category();
