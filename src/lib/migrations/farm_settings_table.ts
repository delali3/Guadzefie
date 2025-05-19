import { supabase } from '../supabase';

export const checkFarmSettingsTable = async () => {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'farm_settings');

  if (error) {
    console.error('Error checking farm_settings table:', error);
    return false;
  }

  return data && data.length > 0;
};

export const ensureFarmSettingsTable = async () => {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
      CREATE TABLE IF NOT EXISTS public.farm_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        farmer_id UUID NOT NULL REFERENCES auth.users(id),
        farm_name TEXT,
        farm_description TEXT,
        delivery_radius NUMERIC DEFAULT 25,
        minimum_order_amount NUMERIC DEFAULT 15,
        free_delivery_amount NUMERIC DEFAULT 50,
        order_auto_accept BOOLEAN DEFAULT true,
        tax_rate NUMERIC DEFAULT 0,
        show_certification BOOLEAN DEFAULT true,
        allow_pickups BOOLEAN DEFAULT true,
        product_visibility TEXT DEFAULT 'public',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(farmer_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS farm_settings_farmer_id_idx ON public.farm_settings(farmer_id);
      
    `
    });

    if (error) {
      console.error('Error creating farm_settings table:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in ensureFarmSettingsTable:', err);
    return { success: false, error: err };
  }
};

export const createFarmSettingsTableIfNotExists = async () => {
  const exists = await checkFarmSettingsTable();
  if (!exists) {
    return await ensureFarmSettingsTable();
  }
  return { success: true };
}; 