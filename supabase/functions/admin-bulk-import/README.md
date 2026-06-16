# VATUUR — admin-bulk-import deployment

Deze function hoort op het **VATUUR**-project, niet op dit admin-project. Voer onderstaande twee stappen daar uit.

## 1. Migratie — tabel `import_job_rows`

Run dit SQL-script eenmaal op de VATUUR-database (Supabase → SQL Editor):

```sql
CREATE TABLE public.import_job_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number int NOT NULL,
  status text NOT NULL CHECK (status IN ('success','failed','skipped')),
  listing_id uuid,
  user_id uuid,
  error text,
  raw jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.import_job_rows TO authenticated;
GRANT ALL ON public.import_job_rows TO service_role;
ALTER TABLE public.import_job_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read import rows" ON public.import_job_rows
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_import_job_rows_job ON public.import_job_rows (job_id);
```

## 2. Edge function `admin-bulk-import`

Plak `index.ts` uit deze map als
`supabase/functions/admin-bulk-import/index.ts` op het VATUUR-project.
Lovable Cloud deployt automatisch.

### CSV-spec (verkort)

Verplicht: `owner_email, title, brand, model, year, price, mileage, fuel_type, transmission`.
Optioneel: `body_type, color, power, description, city, province, images (https-urls met "|" gescheiden), status (draft|active), is_premium, owner_full_name, owner_is_dealer, owner_dealer_name, external_ref`.

Owner-mapping: `owner_email` wordt opgezocht in `profiles`. Bestaat de
gebruiker niet → automatisch invite via `auth.admin.inviteUserByEmail` met
`full_name` uit `owner_full_name`, daarna `profiles` patchen met dealer-info,
en de nieuwe `user.id` gebruiken voor `listings.user_id`.

### Contract

- POST, body: `{ rows: Record<string,string>[], mode: "insert"|"upsert", dry_run?: boolean }`
- Auth: bearer-token van ingelogde admin (de admin-UI doet dit automatisch via `supabase.functions.invoke`).
- Response: `{ job_id, total, succeeded, failed, rows: [{row_number, status, error?, listing_id?}] }`
- `mode=upsert` matcht op `(user_id, external_ref)` waar `external_ref` is gezet, anders insert.