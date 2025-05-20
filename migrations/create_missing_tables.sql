-- Add items_count column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'items_count'
    ) THEN
        ALTER TABLE orders ADD COLUMN items_count INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255),
    store_email VARCHAR(255),
    store_phone VARCHAR(50),
    store_address TEXT,
    store_city VARCHAR(100),
    store_region VARCHAR(100),
    store_country VARCHAR(100) DEFAULT 'Ghana',
    store_postal_code VARCHAR(20),
    store_currency VARCHAR(10) DEFAULT 'GHS',
    store_logo_url TEXT,
    social_instagram VARCHAR(255),
    social_facebook VARCHAR(255),
    social_twitter VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_payment_methods table if it doesn't exist (renamed from payment_methods)
CREATE TABLE IF NOT EXISTS public.admin_payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default shipping methods if the table is empty
INSERT INTO public.shipping_methods (name, description, price, is_active)
SELECT 'Standard Shipping', '3-5 business days', 20.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_methods);

INSERT INTO public.shipping_methods (name, description, price, is_active)
SELECT 'Express Shipping', '1-2 business days', 50.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_methods WHERE id = 2);

INSERT INTO public.shipping_methods (name, description, price, is_active)
SELECT 'Free Pickup', 'Pick up at our store', 0.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_methods WHERE id = 3);

-- Insert default payment methods if the table is empty
INSERT INTO public.admin_payment_methods (name, is_active)
SELECT 'Mobile Money', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.admin_payment_methods);

INSERT INTO public.admin_payment_methods (name, is_active)
SELECT 'Cash on Delivery', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.admin_payment_methods WHERE id = 2);

INSERT INTO public.admin_payment_methods (name, is_active, api_key, api_secret)
SELECT 'Credit Card', FALSE, '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.admin_payment_methods WHERE id = 3); 