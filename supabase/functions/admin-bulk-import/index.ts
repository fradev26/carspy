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
  external_ref: z.string().max(200).optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  is_premium: z.coerce.boolean().optional(),
  status: z.string().optional(),
  external_source: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
});

const bodySchema = z.object({
  target_user_id: z.string().uuid().optional(),
  target_email: z.string().email().optional(),
  auto_invite: z.boolean().optional().default(false),
  mode: z.enum(['insert', 'upsert']).optional().default('insert'),
  source: z.string().min(1).max(80),
  rows: z.array(z.record(z.unknown())).min(1).max(2000),
}).refine((v) => v.target_user_id || v.target_email, {
  message: 'target_user_id or target_email is required',
});

const BATCH_SIZE = 50;
const HEAD_TIMEOUT_MS = 3000;

async function validateImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') ?? '';
    return ct.startsWith('image/');
  } catch {
    return false;
  }
}

async function resolveOwner(
  admin: ReturnType<typeof createClient>,
  body: z.infer<typeof bodySchema>,
  adminUserId: string,
): Promise<{ user_id: string; invited: boolean }> {
  if (body.target_user_id) {
    const { data } = await admin.from('profiles').select('id').eq('id', body.target_user_id).maybeSingle();
    if (data) return { user_id: body.target_user_id, invited: false };
  }
  if (body.target_email) {
    const { data: existing } = await admin.from('profiles').select('id').eq('email', body.target_email).maybeSingle();
    if (existing) return { user_id: existing.id as string, invited: false };

    if (!body.auto_invite) {
      throw new Error(`No profile for ${body.target_email} and auto_invite is false`);
    }
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(body.target_email);
    if (invErr || !invited?.user) throw new Error(`Invite failed: ${invErr?.message ?? 'unknown'}`);
    const newId = invited.user.id;
    await admin.from('profiles').upsert({ id: newId, email: body.target_email }, { onConflict: 'id' });
    await admin.from('admin_actions').insert({
      admin_id: adminUserId,
      action: 'user.invited',
      target_type: 'user',
      target_id: newId,
      details: { email: body.target_email, via: 'bulk_import' },
    });
    return { user_id: newId, invited: true };
  }
  throw new Error('No owner could be resolved');
}

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
    const body = parsed.data;

    let ownerInfo;
    try {
      ownerInfo = await resolveOwner(admin, body, adminUserId);
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const target_user_id = ownerInfo.user_id;

    const { data: job, error: jobErr } = await admin.from('import_jobs').insert({
      user_id: adminUserId,
      source: body.source,
      status: 'running',
      total: body.rows.length,
    }).select().single();
    if (jobErr) throw jobErr;

    await admin.from('admin_actions').insert({
      admin_id: adminUserId,
      action: 'bulk_import.started',
      target_type: 'import_job',
      target_id: job.id,
      details: { source: body.source, total: body.rows.length, mode: body.mode, target_user_id, invited: ownerInfo.invited },
    });

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    const errors: { row: number; error: unknown }[] = [];

    for (let i = 0; i < body.rows.length; i += BATCH_SIZE) {
      const batch = body.rows.slice(i, i + BATCH_SIZE);

      // 1. Validate + image HEAD-checks in parallel per row
      const prepared = await Promise.all(batch.map(async (raw, idx) => {
        const rowIndex = i + idx + 1;
        const r = listingSchema.safeParse(raw);
        if (!r.success) {
          return { rowIndex, ok: false as const, error: r.error.flatten().fieldErrors, payload: raw };
        }
        const data = r.data;
        let imageWarnings: string[] = [];
        if (data.images?.length) {
          const checks = await Promise.all(data.images.map(async (u) => ({ u, ok: await validateImage(u) })));
          const valid = checks.filter((c) => c.ok).map((c) => c.u);
          imageWarnings = checks.filter((c) => !c.ok).map((c) => c.u);
          data.images = valid;
        }
        return { rowIndex, ok: true as const, data: { ...data, user_id: target_user_id }, payload: raw, imageWarnings };
      }));

      // 2. Insert or upsert
      const jobRowsToInsert: Record<string, unknown>[] = [];

      if (body.mode === 'upsert') {
        await Promise.all(prepared.map(async (p) => {
          if (!p.ok) {
            failed++;
            errors.push({ row: p.rowIndex, error: p.error });
            jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'failed', error: p.error, payload: p.payload });
            return;
          }
          const { data: existing } = await admin
            .from('listings')
            .select('id')
            .eq('user_id', target_user_id)
            .eq('title', p.data.title)
            .maybeSingle();
          if (existing) {
            const { error: updErr } = await admin.from('listings').update(p.data).eq('id', existing.id);
            if (updErr) {
              failed++;
              errors.push({ row: p.rowIndex, error: updErr.message });
              jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'failed', error: { message: updErr.message }, payload: p.payload });
            } else {
              succeeded++;
              jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'ok', listing_id: existing.id, error: p.imageWarnings.length ? { image_warnings: p.imageWarnings } : null, payload: p.payload });
            }
          } else {
            const { data: ins, error: insErr } = await admin.from('listings').insert(p.data).select('id').single();
            if (insErr) {
              failed++;
              errors.push({ row: p.rowIndex, error: insErr.message });
              jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'failed', error: { message: insErr.message }, payload: p.payload });
            } else {
              succeeded++;
              jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'ok', listing_id: ins.id, error: p.imageWarnings.length ? { image_warnings: p.imageWarnings } : null, payload: p.payload });
            }
          }
        }));
      } else {
        const valid = prepared.filter((p) => p.ok) as Extract<typeof prepared[number], { ok: true }>[];
        const invalid = prepared.filter((p) => !p.ok) as Extract<typeof prepared[number], { ok: false }>[];
        for (const p of invalid) {
          failed++;
          errors.push({ row: p.rowIndex, error: p.error });
          jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'failed', error: p.error, payload: p.payload });
        }
        if (valid.length) {
          const { data: inserted, error: insErr } = await admin
            .from('listings')
            .insert(valid.map((v) => v.data))
            .select('id');
          if (insErr || !inserted) {
            for (const p of valid) {
              failed++;
              errors.push({ row: p.rowIndex, error: insErr?.message ?? 'insert failed' });
              jobRowsToInsert.push({ job_id: job.id, row_index: p.rowIndex, status: 'failed', error: { message: insErr?.message ?? 'insert failed' }, payload: p.payload });
            }
          } else {
            valid.forEach((p, k) => {
              succeeded++;
              jobRowsToInsert.push({
                job_id: job.id,
                row_index: p.rowIndex,
                status: 'ok',
                listing_id: inserted[k]?.id ?? null,
                error: p.imageWarnings.length ? { image_warnings: p.imageWarnings } : null,
                payload: p.payload,
              });
            });
          }
        }
      }

      if (jobRowsToInsert.length) {
        await admin.from('import_job_rows').insert(jobRowsToInsert);
      }
    }

    const finalStatus = failed === body.rows.length ? 'failed' : 'completed';
    await admin.from('import_jobs').update({
      status: finalStatus,
      succeeded,
      failed,
      error_log: errors.slice(0, 500),
    }).eq('id', job.id);

    await admin.from('admin_actions').insert({
      admin_id: adminUserId,
      action: 'bulk_import.completed',
      target_type: 'import_job',
      target_id: job.id,
      details: { succeeded, failed, skipped, status: finalStatus },
    });

    return new Response(JSON.stringify({
      job_id: job.id,
      target_user_id,
      invited: ownerInfo.invited,
      succeeded,
      failed,
      skipped,
      errors: errors.slice(0, 100),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-bulk-import error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
