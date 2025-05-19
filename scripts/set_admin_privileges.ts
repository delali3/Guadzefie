/**
 * Script to set admin privileges for a user
 * 
 * Usage:
 * npm run set-admin -- user@example.com
 * 
 * Use --revoke flag to remove admin privileges:
 * npm run set-admin -- user@example.com --revoke
 */

import { supabase } from '../src/lib/supabase';

const setAdminPrivileges = async () => {
  try {
    // Get email from command line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Error: Email address is required');
      console.log('Usage: npm run set-admin -- user@example.com');
      process.exit(1);
    }

    const email = args[0];
    const shouldRevoke = args.includes('--revoke');
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, is_admin, first_name, last_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error(`Error: User with email ${email} not found`);
      process.exit(1);
    }

    // Update admin status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_admin: !shouldRevoke,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user:', updateError.message);
      process.exit(1);
    }

    if (shouldRevoke) {
      console.log(`✅ Admin privileges revoked for ${user.email} (${user.first_name} ${user.last_name})`);
    } else {
      console.log(`✅ Admin privileges granted to ${user.email} (${user.first_name} ${user.last_name})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
};

setAdminPrivileges(); 