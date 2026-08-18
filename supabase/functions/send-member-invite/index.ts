import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// Allowed origins for the invite link. Never trust a caller-supplied URL — that
// would turn this endpoint into a branded phishing relay.
const ALLOWED_ORIGINS = [
  'https://vatuur.be',
  'https://www.vatuur.be',
  'https://carspy.lovable.app',
];

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: 'Unauthorized' }, 401);

    const { invitation_id, token, origin } = await req.json();
    if (!invitation_id || !token) return json({ error: 'missing fields' }, 400);

    const supa = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Authorization + content are derived from the database row, never from the caller.
    const { data: inv } = await supa
      .from('company_invitations')
      .select('id, company_id, email, full_name, role, token_hash, accepted_at, revoked_at, expires_at')
      .eq('id', invitation_id)
      .maybeSingle();
    if (!inv) return json({ error: 'not found' }, 404);
    if (inv.token_hash !== (await sha256Hex(token))) return json({ error: 'invalid token' }, 403);
    if (inv.accepted_at || inv.revoked_at || new Date(inv.expires_at) < new Date()) {
      return json({ error: 'invitation closed' }, 409);
    }

    const { data: membership } = await supa
      .from('company_members')
      .select('role, status')
      .eq('company_id', inv.company_id)
      .eq('user_id', caller.id)
      .maybeSingle();
    if (!membership || membership.status !== 'active' || membership.role !== 'owner') {
      return json({ error: 'forbidden' }, 403);
    }

    const base = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const link = `${base}/uitnodiging?token=${encodeURIComponent(token)}`;

    // Best-effort: enqueue via send-transactional-email (template `member-invite`).
    // If transactional email infra isn't set up yet, we still return success and
    // the UI shows the copyable link as a fallback.
    try {
      await supa.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'member-invite',
          recipientEmail: inv.email,
          idempotencyKey: `member-invite-${inv.id}-${Date.now()}`,
          templateData: { link, full_name: inv.full_name ?? '', role: inv.role, invited_email: inv.email },
        },
      });
    } catch (e) {
      console.warn('transactional email skipped:', (e as Error)?.message);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('send-member-invite failed:', (e as Error).message);
    return json({ error: 'Kon uitnodiging niet versturen' }, 500);
  }
});
