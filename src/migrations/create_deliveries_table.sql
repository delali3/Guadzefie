-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  tracking_number VARCHAR(100),
  shipping_method VARCHAR(100) NOT NULL DEFAULT 'standard',
  carrier VARCHAR(100) NOT NULL DEFAULT 'default',
  notes TEXT
);

-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON deliveries(order_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries(status);

-- Create index on created_at for date filtering and sorting
CREATE INDEX IF NOT EXISTS deliveries_created_at_idx ON deliveries(created_at); 