
CREATE TABLE public.import_job_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  status text NOT NULL,
  listing_id uuid,
  error jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.import_job_rows TO authenticated;
GRANT ALL ON public.import_job_rows TO service_role;

ALTER TABLE public.import_job_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view import job rows"
ON public.import_job_rows FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert import job rows"
ON public.import_job_rows FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_import_job_rows_job_id ON public.import_job_rows(job_id);
