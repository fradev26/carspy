# Migratie: fix Bedrijven-pagina 403

## Probleem
Sinds security-hardening migratie `20260818125840` faalt de lees-policy op `public.companies` met `42501 — permission denied for table profiles`. De bestaande policy (`20260616160607`) leest rechtstreeks `profiles.company_id` via een subquery in de `USING`-clausule. Na de REVOKE van die kolommen voor `authenticated` mag dat niet meer, ook niet voor admins: Postgres evalueert de volledige expressie.

## Fix
De `companies`-leespolicy herschrijven zodat deze niet meer zelf `profiles` uitleest, maar de bestaande SECURITY DEFINER helper `public.current_company_id()` gebruikt. Die draait met de rechten van de functie-eigenaar, waardoor de hardening van 18 augustus intact blijft en er geen blanket `GRANT SELECT ON public.profiles` nodig is.

## SQL
```sql
-- Zekerheid: helper bestaat en is SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_company_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;

-- Leesregel herschrijven zonder directe kolomtoegang tot profiles.
DROP POLICY IF EXISTS "Members can read their company" ON public.companies;
CREATE POLICY "Members can read their company"
  ON public.companies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'stock_manager')
    OR id = public.current_company_id()
  );
```

## Wie mag lezen
- Gebruikers met app-rol `admin`.
- Gebruikers met app-rol `stock_manager`.
- Gebruikers waarvan `profiles.company_id` overeenkomt met `companies.id`.

## Verificatie
Na uitvoeren, ingelogd als admin:
```sql
select count(*) from public.companies;
```
Verwacht: het werkelijke aantal bedrijven, geen 42501 meer. De Bedrijven-pagina in de admin hub laadt daarna direct weer data.

## Tabellen gewijzigd
- `public.companies` (policy vervangen).
