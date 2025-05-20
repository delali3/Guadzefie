import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uhlfuddvbkroxrsdgpic.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobGZ1ZGR2Ymtyb3hyc2RncGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwNjAyMDIsImV4cCI6MjAyNDYzNjIwMn0.WI0gCNX_WJ4FCCpFoJnI8hHOJhK5Jb9dNp-kIFVcjXE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMinOrderQuantityMigration() {
  try {
    console.log('Starting min_order_quantity column migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_min_order_quantity_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL migration
    console.log('Applying SQL migration...');
    
    // Try using the exec_sql RPC function
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        throw error;
      }
      
      console.log('Migration applied successfully via RPC!');
    } catch (rpcError) {
      console.warn('RPC method failed, attempting direct query method:', rpcError);
      
      // If RPC fails, try a direct query
      // This will only work with a service role key or in the SQL editor
      try {
        // Check if column exists first
        const { data, error: checkError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'products')
          .eq('column_name', 'min_order_quantity');
          
        if (checkError) {
          throw checkError;
        }
        
        // If column doesn't exist, add it
        if (!data || data.length === 0) {
          console.log('Column does not exist, adding it...');
          
          // This will only work with a service role key
          const { error: alterError } = await supabase.query(`
            ALTER TABLE products ADD COLUMN min_order_quantity INTEGER DEFAULT 1;
          `);
          
          if (alterError) {
            if (alterError.message.includes('permission denied')) {
              console.error('PERMISSION DENIED: Cannot alter table directly.');
              console.error('Please use the Supabase dashboard SQL editor to run this migration:');
              console.error(migrationSQL);
              console.error('\nOr enable auto-migrations in the application by setting localStorage.enable_auto_migrations = true');
            } else {
              throw alterError;
            }
          } else {
            console.log('Column added successfully via direct query!');
          }
        } else {
          console.log('Column already exists, no changes needed.');
        }
      } catch (directError) {
        console.error('Direct query also failed:', directError);
        console.error('Please add the column manually using the Supabase dashboard SQL editor:');
        console.error(migrationSQL);
      }
    }
    
    console.log('Migration process completed!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMinOrderQuantityMigration(); 