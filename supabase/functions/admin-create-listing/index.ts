import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const schema = z.object({
  target_user_id: z.string().uuid(),
  listing: z.object({
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
    features: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    is_premium: z.boolean().optional(),
    status: z.string().optional(),
  }),
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

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { target_user_id, listing } = parsed.data;
    const { data, error } = await admin.from('listings').insert({ ...listing, user_id: target_user_id }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ listing: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-create-listing error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
