import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const bodySchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(200).optional().nullable(),
  is_dealer: z.boolean().optional(),
  dealer_name: z.string().min(1).max(200).optional().nullable(),
  make_admin: z.boolean().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const adminUserId = claimsData.claims.sub;

    const admin = createClient(url, service);

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: adminUserId,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { email, full_name, is_dealer, dealer_name, make_admin } = parsed.data;

    // 1. Invite user via email
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: full_name ?? null,
        is_dealer: !!is_dealer,
        dealer_name: is_dealer ? dealer_name ?? null : null,
      },
    });
    if (invErr || !invited.user) {
      return new Response(JSON.stringify({ error: invErr?.message ?? 'invite failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const newId = invited.user.id;

    // 2. Update profile (handle_new_user trigger created the row)
    await admin
      .from('profiles')
      .update({
        full_name: full_name ?? null,
        is_dealer: !!is_dealer,
        dealer_name: is_dealer ? dealer_name ?? null : null,
      })
      .eq('id', newId);

    // 3. Optionally grant admin role
    if (make_admin) {
      await admin
        .from('user_roles')
        .insert({ user_id: newId, role: 'admin' })
        .select();
    }

    // 4. Audit log
    await admin.from('admin_actions').insert({
      admin_id: adminUserId,
      action: 'user.invited',
      target_type: 'user',
      target_id: newId,
      details: { email, is_dealer: !!is_dealer, make_admin: !!make_admin },
    });

    return new Response(JSON.stringify({ user_id: newId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-invite-user error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
