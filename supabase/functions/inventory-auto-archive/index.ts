// Auto-archives listings that are sold and past their archive window.
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

    // Listings where auto_archive_at has elapsed
    const { data: due, error } = await supabase
      .from('listings')
      .select('id')
      .lte('auto_archive_at', nowIso)
      .eq('status', 'sold');
    if (error) throw error;
    const ids = (due ?? []).map((r) => r.id);

    if (ids.length > 0) {
      await supabase
        .from('listings')
        .update({ status: 'archived', auto_archive_at: null })
        .in('id', ids);
    }

    // Schedule archive_at for newly-sold listings according to dealer prefs
    const { data: prefs } = await supabase
      .from('dealer_inventory_preferences')
      .select('user_id, on_sold_action, archive_after_days')
      .eq('on_sold_action', 'archive_after_days');

    let scheduled = 0;
    for (const pref of prefs ?? []) {
      const { data: soldRows } = await supabase
        .from('listings')
        .select('id, sold_at')
        .eq('user_id', pref.user_id)
        .eq('status', 'sold')
        .is('auto_archive_at', null)
        .not('sold_at', 'is', null);
      for (const r of soldRows ?? []) {
        const archiveAt = new Date(
          new Date(r.sold_at as string).getTime() + pref.archive_after_days * 86400000,
        ).toISOString();
        await supabase.from('listings').update({ auto_archive_at: archiveAt }).eq('id', r.id);
        scheduled++;
      }
    }

    return new Response(
      JSON.stringify({ archived: ids.length, scheduled }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
