-- Add table for discount codes/coupons
CREATE TABLE IF NOT EXISTS public.discounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
    value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table for notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB
);

-- Create index on notifications for faster querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Add table for inventory alerts
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    alert_threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id)
);

-- Add table for user roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.user_roles (name, permissions)
VALUES 
    ('admin', '{"products": {"create": true, "read": true, "update": true, "delete": true}, "orders": {"create": true, "read": true, "update": true, "delete": true}, "customers": {"create": true, "read": true, "update": true, "delete": true}, "settings": {"create": true, "read": true, "update": true, "delete": true}, "reports": {"create": true, "read": true, "update": true, "delete": true}}'),
    ('manager', '{"products": {"create": true, "read": true, "update": true, "delete": false}, "orders": {"create": true, "read": true, "update": true, "delete": false}, "customers": {"create": false, "read": true, "update": false, "delete": false}, "settings": {"create": false, "read": true, "update": false, "delete": false}, "reports": {"create": false, "read": true, "update": false, "delete": false}}'),
    ('staff', '{"products": {"create": false, "read": true, "update": false, "delete": false}, "orders": {"create": true, "read": true, "update": true, "delete": false}, "customers": {"create": false, "read": true, "update": false, "delete": false}, "settings": {"create": false, "read": false, "update": false, "delete": false}, "reports": {"create": false, "read": false, "update": false, "delete": false}}')
ON CONFLICT (name) DO NOTHING;

-- Add role to users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES public.user_roles(id);

-- Add function to handle order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status has changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        -- Create notification for completed order
        INSERT INTO public.notifications (type, title, message, user_id)
        VALUES ('order_completed', 'Order Completed', 'Your order #' || NEW.id || ' has been completed.', NEW.user_id);
    END IF;

    -- Check if status has changed to 'shipped'
    IF NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status <> 'shipped') THEN
        -- Create notification for shipped order
        INSERT INTO public.notifications (type, title, message, user_id)
        VALUES ('order_shipped', 'Order Shipped', 'Your order #' || NEW.id || ' has been shipped.', NEW.user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
CREATE TRIGGER order_status_change_trigger
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_change();

-- Function to check inventory levels and create alerts
CREATE OR REPLACE FUNCTION public.check_inventory_levels()
RETURNS TRIGGER AS $$
DECLARE
    threshold INTEGER;
BEGIN
    -- Get the threshold for this product
    SELECT alert_threshold INTO threshold
    FROM public.inventory_alerts
    WHERE product_id = NEW.id;

    -- If no specific threshold is set, use default of 10
    IF threshold IS NULL THEN
        threshold := 10;
    END IF;

    -- Check if inventory is below threshold
    IF NEW.inventory_count <= threshold AND (OLD.inventory_count IS NULL OR OLD.inventory_count > threshold) THEN
        -- Create notification for low inventory
        INSERT INTO public.notifications (type, title, message, data)
        VALUES (
            'low_inventory', 
            'Low Inventory Alert', 
            'Product "' || NEW.name || '" is low in stock (' || NEW.inventory_count || ' remaining).', 
            json_build_object('product_id', NEW.id, 'product_name', NEW.name, 'current_stock', NEW.inventory_count)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory checks
DROP TRIGGER IF EXISTS inventory_check_trigger ON public.products;
CREATE TRIGGER inventory_check_trigger
AFTER UPDATE OF inventory_count ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_inventory_levels();

-- Update all timestamps to include a default now() value and update automatically
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables that might not have them
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Check if updated_at column exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t 
            AND column_name = 'updated_at'
        ) THEN
            -- Add trigger if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_trigger 
                WHERE tgname = t || '_update_timestamp'
            ) THEN
                EXECUTE format('
                    CREATE TRIGGER %I
                    BEFORE UPDATE ON public.%I
                    FOR EACH ROW
                    EXECUTE FUNCTION public.update_modified_column();
                ', t || '_update_timestamp', t);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 