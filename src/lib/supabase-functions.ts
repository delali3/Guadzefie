import { supabase } from './supabase';
import { createFarmSettingsTableIfNotExists } from './migrations/farm_settings_table';

// Register the RPC functions with Supabase
export const registerRpcFunctions = async () => {
  // We can't directly set functions on the client
  // Use an alternative approach to call RPC functions
  try {
    // Check if the function exists first
    await supabase.rpc('create_farm_settings_table_if_not_exists');
  } catch (error) {
    console.log('RPC function not registered on server, would need to create it in database directly');
    // Fall back to direct function call
    const result = await createFarmSettingsTableIfNotExists();
    return result;
  }
};

// Call this function at app startup
export const initSupabaseFunctions = () => {
  registerRpcFunctions().catch(err => {
    console.error('Error registering RPC functions:', err);
  });
}; 