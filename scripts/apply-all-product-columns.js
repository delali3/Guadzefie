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

async function applyAllProductColumnsMigration() {
  try {
    console.log('Starting combined product columns migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_all_missing_product_columns.sql');
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
      console.warn('RPC method failed:', rpcError);
      console.error('Please run this migration using the Supabase SQL Editor:');
      console.log(migrationSQL);
      
      console.error('\nAlternatively, you can turn on auto-migrations in the app by setting:');
      console.error('localStorage.enable_auto_migrations = true');
      console.error('and then refreshing the page.');
    }
    
    console.log('Combined migration process completed!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyAllProductColumnsMigration(); 