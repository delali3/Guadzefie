import { supabase } from '../supabase';

/**
 * Ensures the products table has the is_available column
 * This is needed for tracking product availability status
 */
export const ensureIsAvailableColumn = async () => {
  try {
    console.log('Checking for is_available column in products table...');
    
    // SQL script to add is_available column if it doesn't exist
    const sql = `
      DO $$ 
      BEGIN
        -- Check if the is_available column doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'is_available'
        ) THEN
          -- Add the is_available column with DEFAULT true
          ALTER TABLE products ADD COLUMN is_available BOOLEAN DEFAULT true;
          
          -- Add a comment to the column for documentation
          COMMENT ON COLUMN products.is_available IS 'Indicates if the product is currently available for purchase';
        END IF;
      END $$;
    `;
    
    // Execute the migration directly
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql RPC fails, try raw SQL query
      console.warn('exec_sql RPC failed, trying direct SQL query:', error);
      
      // Check if the column exists
      const { data: columnCheck } = await supabase.from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'products')
        .eq('column_name', 'is_available');
      
      if (!columnCheck || columnCheck.length === 0) {
        // Column doesn't exist, add it
        const { error: alterTableError } = await supabase.query(`
          ALTER TABLE products ADD COLUMN is_available BOOLEAN DEFAULT true;
        `);
        
        if (alterTableError) {
          throw new Error(`Failed to add is_available column: ${alterTableError.message}`);
        }
      }
    }
    
    console.log('is_available column migration completed successfully');
    return { success: true };
  } catch (err) {
    console.error('Error in ensureIsAvailableColumn migration:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
};

export default ensureIsAvailableColumn; 