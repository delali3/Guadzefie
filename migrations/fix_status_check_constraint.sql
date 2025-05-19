-- Migration script to fix the orders_status_check constraint
-- This script modifies the constraint to include all valid statuses

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Drop the existing constraint
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        
        -- Add the constraint back with all the correct status values
        -- We're adding 'Processing' as it was missing from the original constraint
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'));
        
        RAISE NOTICE 'Successfully updated orders_status_check constraint to include all required statuses';
    ELSE
        RAISE NOTICE 'orders table does not exist, no changes made';
    END IF;
END $$; 