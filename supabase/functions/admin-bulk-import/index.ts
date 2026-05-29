import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const listingSchema = z.object({
  title: z.string().min(1).max(200),
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(2100),
  price: z.coerce.number().int().min(0),
  mileage: z.coerce.number().int().min(0),
  fuel_type: z.string().min(1),
  transmission: z.string().min(1),
  body_type: z.string().min(1),
  color: z.string().optional().nullable(),
  power: z.coerce.number().int().optional().nullable(),
  engine_size: z.coerce.number().optional().nullable(),
  doors: z.coerce.number().int().optional().nullable(),
  seats: z.coerce.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  is_premium: z.coerce.boolean().optional(),
  status: z.string().optional(),
  external_source: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
});

const bodySchema = z.object({
  target_user_id: z.string().uuid(),
  source: z.string().min(1).max(80),
  rows: z.array(z.record(z.unknown())).min(1).max(2000),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const adminUserId = claimsData.claims.sub;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: adminUserId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { target_user_id, source, rows } = parsed.data;

    const { data: job, error: jobErr } = await admin.from('import_jobs').insert({
      user_id: adminUserId,
      source,
      status: 'running',
      total: rows.length,
    }).select().single();
    if (jobErr) throw jobErr;

    let succeeded = 0;
    const errors: { row: number; error: unknown }[] = [];
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const validRows: Record<string, unknown>[] = [];
      batch.forEach((raw, idx) => {
        const r = listingSchema.safeParse(raw);
        if (!r.success) {
          errors.push({ row: i + idx + 1, error: r.error.flatten().fieldErrors });
        } else {
          validRows.push({ ...r.data, user_id: target_user_id });
        }
      });

      if (validRows.length) {
        const { error: insErr, count } = await admin
          .from('listings')
          .insert(validRows, { count: 'exact' });
        if (insErr) {
          errors.push({ row: i + 1, error: insErr.message });
        } else {
          succeeded += count ?? validRows.length;
        }
      }
    }

    await admin.from('import_jobs').update({
      status: errors.length === rows.length ? 'failed' : 'completed',
      succeeded,
      failed: rows.length - succeeded,
      error_log: errors.slice(0, 500),
    }).eq('id', job.id);

    return new Response(JSON.stringify({ job_id: job.id, succeeded, failed: rows.length - succeeded, errors: errors.slice(0, 100) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-bulk-import error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
