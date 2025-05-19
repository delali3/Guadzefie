import { supabase } from '../supabase';

export const checkProductsQuantityField = async () => {
  try {
    // Check if the quantity column exists in the products table
    const { data, error } = await supabase.rpc('check_column_exists', {
      table_name: 'products',
      column_name: 'quantity'
    });
    
    // If RPC not available or error occurs, try alternative check
    if (error) {
      // Try a simple query that uses the quantity column
      const { error: queryError } = await supabase
        .from('products')
        .select('quantity')
        .limit(1);
      
      // If error doesn't mention the column doesn't exist, assume it exists
      if (!queryError || !queryError.message.includes('column "quantity" does not exist')) {
        return true;
      }
      
      return false;
    }
    
    return data;
  } catch (error) {
    console.error("Error checking products quantity field:", error);
    return false;
  }
};

export const ensureProductsQuantityField = async () => {
  try {
    // SQL script to add quantity field and rename stock column if it exists
    const sql = `
      DO $$ 
      BEGIN
        -- Check if stock column exists and quantity doesn't exist
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'stock'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'quantity'
        ) THEN
          -- Rename stock to quantity
          ALTER TABLE products RENAME COLUMN stock TO quantity;
          
          -- Also rename min_stock to min_quantity if it exists
          IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'min_stock'
          ) THEN
            ALTER TABLE products RENAME COLUMN min_stock TO min_quantity;
          END IF;
        
        -- If stock doesn't exist and neither does quantity, add quantity
        ELSIF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'quantity'
        ) THEN
          -- Add quantity column
          ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 0;
          
          -- Add min_quantity if it doesn't exist
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'min_quantity'
          ) THEN
            ALTER TABLE products ADD COLUMN min_quantity INTEGER DEFAULT 5;
          END IF;
        END IF;
      END $$;
    `;
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If RPC isn't available, check if we have direct SQL access
      console.error("Error using RPC for migration:", error);
      return { 
        success: false, 
        message: 'Products table update needs to be performed by an administrator with SQL access.'
      };
    }
    
    return { success: true, message: 'Products table updated with quantity field' };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
}; 