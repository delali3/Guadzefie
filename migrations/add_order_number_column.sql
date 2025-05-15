-- Migration script to fix order ID issue and add missing columns

-- Check if the orders table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN

        -- Step 1: Add order_number column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'orders' AND column_name = 'order_number') THEN
            ALTER TABLE orders ADD COLUMN order_number TEXT;
            COMMENT ON COLUMN orders.order_number IS 'Human-readable order number for display purposes, while id is a numeric primary key';
        END IF;

        -- Step 2: Update existing orders to have an order_number based on their ID
        UPDATE orders SET order_number = CONCAT('ORD-', id::text) WHERE order_number IS NULL;

        -- Step 3: Add payment_reference column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'orders' AND column_name = 'payment_reference') THEN
            ALTER TABLE orders ADD COLUMN payment_reference TEXT;
            COMMENT ON COLUMN orders.payment_reference IS 'Payment reference ID from payment processor';
        END IF;

        -- Step 4: Update ID column type if needed
        -- Note: This is advanced and would need to be handled carefully in a production environment
        -- This is just a placeholder for what would be needed if changing column types
        
        -- Create temp column for numeric IDs
        --ALTER TABLE orders ADD COLUMN IF NOT EXISTS numeric_id INTEGER;
        
        -- Convert string IDs to numeric (would need custom handling)
        --UPDATE orders SET numeric_id = ... custom conversion logic ...;
        
        -- Create backup of orders table
        --CREATE TABLE orders_backup AS SELECT * FROM orders;
        
        -- Drop existing primary key constraint
        --ALTER TABLE orders DROP CONSTRAINT orders_pkey;
        
        -- Change ID column to numeric type
        --ALTER TABLE orders ALTER COLUMN id TYPE INTEGER USING numeric_id;
        
        -- Add primary key constraint back
        --ALTER TABLE orders ADD PRIMARY KEY (id);
        
        -- Drop temporary column
        --ALTER TABLE orders DROP COLUMN numeric_id;

    END IF;
END $$;

-- Future Migration Note: If needed, you may want to add an index on order_number for faster lookups
-- CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number); 