-- This script can be executed directly in the Supabase SQL Editor
-- It fixes the missing column and tables issues

-- Add items_count column to orders table if it doesn't exist
ALTER TABLE IF EXISTS orders 
ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;

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

-- Insert a default settings record if the table is empty
INSERT INTO public.settings (
    store_name, 
    store_email, 
    store_phone, 
    store_address, 
    store_city, 
    store_region, 
    store_country, 
    store_postal_code, 
    store_currency
)
SELECT 
    'My Store',
    '',
    '',
    '',
    '',
    '',
    'Ghana',
    '',
    'GHS'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

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
INSERT INTO public.shipping_methods (id, name, description, price, is_active)
VALUES 
    (1, 'Standard Shipping', '3-5 business days', 20.00, TRUE),
    (2, 'Express Shipping', '1-2 business days', 50.00, TRUE),
    (3, 'Free Pickup', 'Pick up at our store', 0.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert default payment methods if the table is empty
INSERT INTO public.admin_payment_methods (id, name, is_active, api_key, api_secret)
VALUES 
    (1, 'Mobile Money', TRUE, NULL, NULL),
    (2, 'Cash on Delivery', TRUE, NULL, NULL),
    (3, 'Credit Card', FALSE, '', '')
ON CONFLICT (id) DO NOTHING; 