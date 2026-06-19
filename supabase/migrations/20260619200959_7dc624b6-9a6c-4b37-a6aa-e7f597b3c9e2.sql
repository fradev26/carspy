ALTER TABLE public.autoscout_credentials
  ADD COLUMN IF NOT EXISTS auto_publish            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_direction          text    NOT NULL DEFAULT 'import_only',
  ADD COLUMN IF NOT EXISTS publish_new_vehicles    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_price              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_photos             boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_description        boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_specs              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS remove_on_sold          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_stock              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS draft_mode              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_schedule           text    NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sync_priority           text    NOT NULL DEFAULT 'normal';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'autoscout_credentials_sync_direction_chk') THEN
    ALTER TABLE public.autoscout_credentials
      ADD CONSTRAINT autoscout_credentials_sync_direction_chk
      CHECK (sync_direction IN ('import_only','export_only','both'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'autoscout_credentials_sync_schedule_chk') THEN
    ALTER TABLE public.autoscout_credentials
      ADD CONSTRAINT autoscout_credentials_sync_schedule_chk
      CHECK (sync_schedule IN ('manual','15min','hourly','daily'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'autoscout_credentials_sync_priority_chk') THEN
    ALTER TABLE public.autoscout_credentials
      ADD CONSTRAINT autoscout_credentials_sync_priority_chk
      CHECK (sync_priority IN ('low','normal','high'));
  END IF;
END $$;