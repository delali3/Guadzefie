import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uhlfuddvbkroxrsdgpic.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobGZ1ZGR2Ymtyb3hyc2RncGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwNjAyMDIsImV4cCI6MjAyNDYzNjIwMn0.WI0gCNX_WJ4FCCpFoJnI8hHOJhK5Jb9dNp-kIFVcjXE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Starting migration process...');
    
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_farmer_id_to_products.sql');
    const sqlMigration = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL migration
    const { error } = await supabase.rpc('pgmigrate', {
      query: sqlMigration
    });
    
    if (error) {
      // If the pgmigrate RPC doesn't exist, try executing the SQL directly
      if (error.message.includes('function "pgmigrate" does not exist')) {
        console.log('pgmigrate RPC not found, executing SQL using raw query...');
        const { error: sqlError } = await supabase.sql(sqlMigration);
        
        if (sqlError) {
          if (sqlError.message.includes('permission denied')) {
            console.error('ERROR: Permission denied.');
            console.error('You need to use a service role key to execute raw SQL.');
            console.error('Consider using the Supabase dashboard to run this migration.');
            throw sqlError;
          } else {
            throw sqlError;
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log('Migration applied successfully!');
    console.log('The farmer_id, vendor_id, and owner_id columns are now available in the products table.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nAlternative approach: You can manually run the migration SQL in the Supabase dashboard SQL editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to the SQL Editor tab');
    console.log('3. Create a new query and paste the content of migrations/add_farmer_id_to_products.sql');
    console.log('4. Run the query');
  }
}

applyMigration();
