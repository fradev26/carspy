
-- Add business fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_website text;

-- Update handle_new_user trigger to include dealer fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, dealer_name, is_dealer, vat_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'dealer_name',
    COALESCE((NEW.raw_user_meta_data->>'is_dealer')::boolean, false),
    NEW.raw_user_meta_data->>'vat_number'
  );
  RETURN NEW;
END;
$function$;
