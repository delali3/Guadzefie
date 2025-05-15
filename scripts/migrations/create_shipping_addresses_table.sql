-- Create shipping_addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);

-- Create RLS policies for shipping_addresses table
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own addresses
CREATE POLICY "Users can view their own shipping addresses" 
    ON shipping_addresses FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy for users to insert their own addresses
CREATE POLICY "Users can insert their own shipping addresses" 
    ON shipping_addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own addresses
CREATE POLICY "Users can update their own shipping addresses" 
    ON shipping_addresses FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy for users to delete their own addresses
CREATE POLICY "Users can delete their own shipping addresses" 
    ON shipping_addresses FOR DELETE 
    USING (auth.uid() = user_id);

-- Make sure only one address is default per user
CREATE OR REPLACE FUNCTION update_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE shipping_addresses
        SET is_default = false
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update default address
DROP TRIGGER IF EXISTS update_default_address_trigger ON shipping_addresses;
CREATE TRIGGER update_default_address_trigger
BEFORE INSERT OR UPDATE ON shipping_addresses
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION update_default_address(); 