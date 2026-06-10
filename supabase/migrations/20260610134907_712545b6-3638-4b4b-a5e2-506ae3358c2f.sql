
-- Identificatie & herkomst
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS as24_listing_id text,
  ADD COLUMN IF NOT EXISTS as24_publication_status text,
  ADD COLUMN IF NOT EXISTS vin text,
  ADD COLUMN IF NOT EXISTS licence_plate text,
  ADD COLUMN IF NOT EXISTS cross_reference_id text,
  ADD COLUMN IF NOT EXISTS offer_reference_id text,
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS condition_type text,
  ADD COLUMN IF NOT EXISTS model_version text;

-- Eenheden en extra carrosserie
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS mileage_unit text DEFAULT 'km',
  ADD COLUMN IF NOT EXISTS power_unit text DEFAULT 'kW',
  ADD COLUMN IF NOT EXISTS alloy_wheel_size int,
  ADD COLUMN IF NOT EXISTS alloy_wheel_size_unit text DEFAULT 'inch',
  ADD COLUMN IF NOT EXISTS empty_weight int,
  ADD COLUMN IF NOT EXISTS empty_weight_unit text DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS door_count int,
  ADD COLUMN IF NOT EXISTS seat_count int;

-- Motor & aandrijving
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS additional_fuel_types text[],
  ADD COLUMN IF NOT EXISTS cylinder_capacity int,
  ADD COLUMN IF NOT EXISTS cylinder_capacity_unit text DEFAULT 'ccm',
  ADD COLUMN IF NOT EXISTS cylinder_count int,
  ADD COLUMN IF NOT EXISTS drivetrain text,
  ADD COLUMN IF NOT EXISTS gear_count int;

-- Verbruik & emissies
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS co2_emissions numeric,
  ADD COLUMN IF NOT EXISTS co2_emissions_unit text DEFAULT 'g/km',
  ADD COLUMN IF NOT EXISTS consumption_combined numeric,
  ADD COLUMN IF NOT EXISTS consumption_city numeric,
  ADD COLUMN IF NOT EXISTS consumption_country numeric,
  ADD COLUMN IF NOT EXISTS combined_unit text DEFAULT 'l/100km',
  ADD COLUMN IF NOT EXISTS emission_class text,
  ADD COLUMN IF NOT EXISTS emission_sticker text,
  ADD COLUMN IF NOT EXISTS efficiency_class text,
  ADD COLUMN IF NOT EXISTS particle_filter boolean;

-- Registratie & ownership
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS first_registration_date date,
  ADD COLUMN IF NOT EXISTS previous_owner_count int,
  ADD COLUMN IF NOT EXISTS country_version text;

-- Prijs & btw
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS price_public int,
  ADD COLUMN IF NOT EXISTS price_dealer int,
  ADD COLUMN IF NOT EXISTS price_negotiable boolean,
  ADD COLUMN IF NOT EXISTS vat_deductible boolean,
  ADD COLUMN IF NOT EXISTS vat_rate numeric;

-- Garantie & inspectie
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS warranty_months int,
  ADD COLUMN IF NOT EXISTS warranty_unit text DEFAULT 'months',
  ADD COLUMN IF NOT EXISTS warranty_type text,
  ADD COLUMN IF NOT EXISTS warranty_details text,
  ADD COLUMN IF NOT EXISTS inspection_date date,
  ADD COLUMN IF NOT EXISTS next_inspection_date date;

-- Vrije lijsten
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS equipment text[],
  ADD COLUMN IF NOT EXISTS highlights text[],
  ADD COLUMN IF NOT EXISTS included_services text[],
  ADD COLUMN IF NOT EXISTS publication_channels text[];

-- Geneste jsonb
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS service_history jsonb,
  ADD COLUMN IF NOT EXISTS leasing_offers jsonb,
  ADD COLUMN IF NOT EXISTS marketing jsonb,
  ADD COLUMN IF NOT EXISTS publication jsonb,
  ADD COLUMN IF NOT EXISTS availability jsonb,
  ADD COLUMN IF NOT EXISTS condition jsonb;

-- Catch-all
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS specs jsonb,
  ADD COLUMN IF NOT EXISTS raw_autoscout jsonb;

-- Spiegel price <-> price_public
CREATE OR REPLACE FUNCTION public.sync_listing_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.price_public IS NULL AND NEW.price IS NOT NULL THEN
    NEW.price_public := NEW.price;
  ELSIF NEW.price IS NULL AND NEW.price_public IS NOT NULL THEN
    NEW.price := NEW.price_public;
  ELSIF TG_OP = 'UPDATE' AND NEW.price_public IS DISTINCT FROM OLD.price_public
        AND NEW.price IS NOT DISTINCT FROM OLD.price THEN
    NEW.price := NEW.price_public;
  ELSIF TG_OP = 'UPDATE' AND NEW.price IS DISTINCT FROM OLD.price
        AND NEW.price_public IS NOT DISTINCT FROM OLD.price_public THEN
    NEW.price_public := NEW.price;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_listing_price_trg ON public.listings;
CREATE TRIGGER sync_listing_price_trg
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_price();

-- Backfill price_public from price for existing rows
UPDATE public.listings SET price_public = price WHERE price_public IS NULL AND price IS NOT NULL;

-- Indexen
CREATE INDEX IF NOT EXISTS listings_source_idx ON public.listings (source);
CREATE INDEX IF NOT EXISTS listings_as24_listing_id_idx ON public.listings (as24_listing_id);
CREATE INDEX IF NOT EXISTS listings_vin_idx ON public.listings (vin);
CREATE INDEX IF NOT EXISTS listings_brand_model_idx ON public.listings (brand, model);
