DO $$ 
BEGIN
  -- Check if stock column exists and quantity doesn't exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'quantity'
  ) THEN
    -- Rename stock to quantity
    ALTER TABLE products RENAME COLUMN stock TO quantity;
    
    -- Also rename min_stock to min_quantity if it exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'min_stock'
    ) THEN
      ALTER TABLE products RENAME COLUMN min_stock TO min_quantity;
    END IF;
  
  -- If stock doesn't exist and neither does quantity, add quantity
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'quantity'
  ) THEN
    -- Add quantity column
    ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 0;
    
    -- Add min_quantity if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'min_quantity'
    ) THEN
      ALTER TABLE products ADD COLUMN min_quantity INTEGER DEFAULT 5;
    END IF;
  END IF;
END $$; 