import { supabase } from '../supabase';

export const checkFarmCustomersTable = async () => {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'farm_customers');

  if (error) {
    console.error('Error checking farm_customers table:', error);
    return false;
  }

  return data && data.length > 0;
};

export const ensureFarmCustomersTable = async () => {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
      CREATE TABLE IF NOT EXISTS public.farm_customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        farm_id UUID NOT NULL REFERENCES auth.users(id),
        customer_id UUID NOT NULL REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(farm_id, customer_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS farm_customers_farm_id_idx ON public.farm_customers(farm_id);
      CREATE INDEX IF NOT EXISTS farm_customers_customer_id_idx ON public.farm_customers(customer_id);
      
    `
    });

    if (error) {
      console.error('Error creating farm_customers table:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in ensureFarmCustomersTable:', err);
    return { success: false, error: err };
  }
}; 