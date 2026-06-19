import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { invitation_id, token, link, email, full_name, role } = await req.json();
    if (!invitation_id || !token || !link || !email) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Best-effort: enqueue via send-transactional-email (template `member-invite`).
    // If transactional email infra isn't set up yet, we still return success and
    // the UI shows the copyable link as a fallback.
    try {
      await supa.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'member-invite',
          recipientEmail: email,
          idempotencyKey: `member-invite-${invitation_id}`,
          templateData: { link, full_name: full_name ?? '', role, invited_email: email },
        },
      });
    } catch (e) {
      console.warn('transactional email skipped:', (e as Error)?.message);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
