-- Add estimated_delivery column to orders table
ALTER TABLE orders ADD COLUMN estimated_delivery TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX idx_orders_estimated_delivery ON orders(estimated_delivery);

-- Update existing orders with a default estimated delivery date (7 days from creation)
UPDATE orders 
SET estimated_delivery = created_at::timestamp + interval '7 days'
WHERE estimated_delivery IS NULL;
