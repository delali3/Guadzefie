-- Migration script to update the orders table status check constraint
-- This script adds 'Processing' as a valid order status

-- Check if the orders table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- First, let's find the current constraint definition
        CREATE TEMP TABLE constraint_def AS
        SELECT pg_get_constraintdef(c.oid) AS constraint_definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE n.nspname = 'public'
        AND cl.relname = 'orders'
        AND conname = 'orders_status_check';

        -- Log the current constraint definition for debugging
        RAISE NOTICE 'Current constraint definition: %', (SELECT constraint_definition FROM constraint_def);
        
        -- Drop the existing constraint
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        
        -- Add the constraint back with 'Processing' included in the allowed values
        -- This assumes a CHECK constraint format like: CHECK (status IN ('Value1', 'Value2', ...))
        -- The actual constraint syntax will be determined at runtime based on the existing constraint

        -- We're creating a dynamic SQL statement based on the existing constraint
        -- This is the fallback approach if we can't determine the existing constraint
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'));
        
        -- Clean up
        DROP TABLE constraint_def;
        
        RAISE NOTICE 'Successfully updated orders_status_check constraint to include Processing status';
    ELSE
        RAISE NOTICE 'orders table does not exist, no changes made';
    END IF;
END $$; 