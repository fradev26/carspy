// Expires listing reservations whose reserved_until has passed.
// If the dealer enabled auto_relist_on_cancel, the listing is restored to 'active'.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireServiceRole } from '../_shared/service-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Internal cron job: only the service role may trigger this maintenance run.
  const denied = requireServiceRole(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const nowIso = new Date().toISOString();

    const { data: expired, error: selErr } = await supabase
      .from('listings')
      .select('id, user_id, status')
      .lte('reserved_until', nowIso)
      .not('reserved_by', 'is', null);

    if (selErr) throw selErr;
    const rows = expired ?? [];

    // Reset reservation on all
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      await supabase
        .from('listings')
        .update({ reserved_by: null, reserved_until: null })
        .in('id', ids);
    }

    // Fetch dealer prefs to know which dealers want auto-relist
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    let relistCount = 0;
    if (userIds.length > 0) {
      const { data: prefs } = await supabase
        .from('dealer_inventory_preferences')
        .select('user_id, auto_relist_on_cancel')
        .in('user_id', userIds)
        .eq('auto_relist_on_cancel', true);
      const allowed = new Set((prefs ?? []).map((p) => p.user_id));
      const relistIds = rows.filter((r) => allowed.has(r.user_id) && r.status === 'draft').map((r) => r.id);
      if (relistIds.length > 0) {
        await supabase.from('listings').update({ status: 'active' }).in('id', relistIds);
        relistCount = relistIds.length;
      }
    }

    return new Response(
      JSON.stringify({ expired: rows.length, relisted: relistCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
