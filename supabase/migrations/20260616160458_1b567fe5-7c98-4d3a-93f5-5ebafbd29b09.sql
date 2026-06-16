CREATE EXTENSION IF NOT EXISTS supabase_vault;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'stock_manager'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'stock_manager';
  END IF;
END $$;