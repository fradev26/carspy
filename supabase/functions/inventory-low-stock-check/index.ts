// Counts active listings per dealer and notifies dealers whose count is at or below
// their low_stock_threshold (respecting push/email preferences).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { data: prefs, error } = await supabase
      .from('dealer_inventory_preferences')
      .select('user_id, low_stock_threshold, low_stock_push, low_stock_email')
      .or('low_stock_push.eq.true,low_stock_email.eq.true');
    if (error) throw error;

    const triggered: Array<{ user_id: string; count: number; threshold: number }> = [];

    for (const pref of prefs ?? []) {
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', pref.user_id)
        .eq('status', 'active');
      const active = count ?? 0;
      if (active <= pref.low_stock_threshold) {
        triggered.push({ user_id: pref.user_id, count: active, threshold: pref.low_stock_threshold });
        // Hook: enqueue notification through whichever notification pipeline exists.
        // For now we just log; a downstream notification function can subscribe.
        console.log(
          `[low-stock] user=${pref.user_id} active=${active} threshold=${pref.low_stock_threshold} push=${pref.low_stock_push} email=${pref.low_stock_email}`,
        );
      }
    }

    return new Response(
      JSON.stringify({ checked: prefs?.length ?? 0, triggered: triggered.length, details: triggered }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
