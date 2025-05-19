-- SAFE CHECK FUNCTION
-- This version won't try to create or modify anything
-- Use this in your app's initialization to safely check for table existence

CREATE OR REPLACE FUNCTION public.safely_check_farm_settings()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if table exists using pg_tables instead of information_schema
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'farm_settings'
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$; 