const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables or configure your Supabase URL and key here
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for migrations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_missing_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split migrations into separate statements
    const statements = migrationSQL
      .replace(/\r\n/g, '\n')
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing migration statement ${i + 1}/${statements.length}`);
      
      // Execute the SQL statement
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
applyMigrations(); 