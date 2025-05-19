import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uhlfuddvbkroxrsdgpic.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobGZ1ZGR2Ymtyb3hyc2RncGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwNjAyMDIsImV4cCI6MjAyNDYzNjIwMn0.WI0gCNX_WJ4FCCpFoJnI8hHOJhK5Jb9dNp-kIFVcjXE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDirectProductsMigration() {
  try {
    console.log('Starting products table migration...');
    
    // SQL to add quantity column to products table
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
    
    // First try using the exec_sql RPC if available
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql });
    
    if (rpcError) {
      console.log('RPC method not available, trying direct query...');
      
      // Try direct SQL query if RPC isn't available (might require service role)
      const { error: sqlError } = await supabase.sql(sql);
      
      if (sqlError) {
        if (sqlError.message.includes('permission denied')) {
          console.error('Error: Permission denied.');
          console.error('You need to use a service role key to execute raw SQL.');
          console.error('Consider using the Supabase dashboard to run this migration.');
          
          // Provide SQL for manual execution
          console.log('\nSQL to run in Supabase dashboard:');
          console.log('--------------------------------');
          console.log(sql);
          console.log('--------------------------------');
        } else {
          console.error('SQL Error:', sqlError);
        }
      } else {
        console.log('✅ Products table migration successful!');
      }
    } else {
      console.log('✅ Products table migration successful!');
    }
  } catch (error) {
    console.error('Migration failed with an exception:', error);
    
    // Display SQL for manual execution
    console.log('\nIf automatic migration failed, you can manually run the SQL in the Supabase dashboard:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to the SQL Editor tab');
    console.log('3. Create a new query with the SQL shown above');
    console.log('4. Run the query');
  }
}

applyDirectProductsMigration(); 