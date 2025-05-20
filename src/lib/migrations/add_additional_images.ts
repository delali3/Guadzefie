import { supabase } from '../supabase';

/**
 * Ensures the products table has the additional_images column
 * This is needed for storing multiple product images
 */
export const ensureAdditionalImagesColumn = async () => {
  try {
    console.log('Checking for additional_images column in products table...');
    
    // SQL script to add additional_images column if it doesn't exist
    const sql = `
      DO $$ 
      BEGIN
        -- Check if the additional_images column doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'additional_images'
        ) THEN
          -- Add the additional_images column as a text array
          ALTER TABLE products ADD COLUMN additional_images TEXT[];
          
          -- Add a comment to the column for documentation
          COMMENT ON COLUMN products.additional_images IS 'Array of URLs for additional product images beyond the primary image_url';
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
        .eq('column_name', 'additional_images');
      
      if (!columnCheck || columnCheck.length === 0) {
        // Column doesn't exist, add it
        const { error: alterTableError } = await supabase.query(`
          ALTER TABLE products ADD COLUMN additional_images TEXT[];
        `);
        
        if (alterTableError) {
          throw new Error(`Failed to add additional_images column: ${alterTableError.message}`);
        }
      }
    }
    
    console.log('Additional images column migration completed successfully');
    return { success: true };
  } catch (err) {
    console.error('Error in ensureAdditionalImagesColumn migration:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
};

export default ensureAdditionalImagesColumn; 