-- Migration script to fix Row-Level Security on the order_items table
-- This script creates or modifies RLS policies to allow order item insertion

BEGIN;

-- Enable RLS on the order_items table if not already enabled
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Allow authenticated users to insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Allow users to view their own order items" ON order_items;

-- Create policy to allow users to insert order items for their orders
CREATE POLICY "Allow authenticated users to insert their own order items" 
ON order_items 
FOR INSERT 
TO authenticated
USING (
  -- Check if the order belongs to the current user
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Check if the order belongs to the current user
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Create policy to allow users to view their own order items
CREATE POLICY "Allow users to view their own order items" 
ON order_items 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- For service role access (for admin functions)
-- This allows the service role to bypass RLS
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

COMMIT; 