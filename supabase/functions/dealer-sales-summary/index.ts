import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse, requireAuth, rateLimit } from "../_shared/ai-guard.ts";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400_000).toISOString();
}
function avg(xs: number[]) {
  if (!xs.length) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}
function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

export async function buildDealerSummary(userId: string) {
  const sb = admin();

  const { data: listings } = await sb
    .from("listings")
    .select("id,title,brand,model,year,price,cost_price,sold_price,sold_at,status,created_at,views,images")
    .eq("user_id", userId)
    .limit(2000);

  const all = listings ?? [];
  const active = all.filter((l) => l.status === "active");
  const sold = all.filter((l) => l.status === "sold" && l.sold_at);

  const now = Date.now();
  const inRange = (iso: string | null, days: number) =>
    iso ? (now - new Date(iso).getTime()) <= days * 86400_000 : false;

  const soldToday = sold.filter((l) => inRange(l.sold_at, 1));
  const soldWeek = sold.filter((l) => inRange(l.sold_at, 7));
  const soldMonth = sold.filter((l) => inRange(l.sold_at, 30));
  const soldPrev = sold.filter((l) =>
    l.sold_at && (now - new Date(l.sold_at).getTime()) > 30 * 86400_000
    && (now - new Date(l.sold_at).getTime()) <= 60 * 86400_000
  );

  const revenue = (rows: typeof sold) => sum(rows.map((r) => r.sold_price ?? r.price ?? 0));
  const margins = (rows: typeof sold) =>
    rows.filter((r) => r.sold_price != null && r.cost_price != null)
        .map((r) => (r.sold_price! - r.cost_price!));

  const monthMargins = margins(soldMonth);
  const avgMarginPct = (() => {
    const rows = soldMonth.filter((r) => r.sold_price && r.cost_price);
    if (!rows.length) return 0;
    const pcts = rows.map((r) => ((r.sold_price! - r.cost_price!) / r.sold_price!) * 100);
    return Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10;
  })();

  const avgSaleTime = avg(
    sold.filter((l) => l.sold_at && l.created_at).map((l) =>
      Math.floor((new Date(l.sold_at!).getTime() - new Date(l.created_at).getTime()) / 86400_000)
    ),
  );
  const avgStockAge = avg(
    active.map((l) => Math.floor((now - new Date(l.created_at).getTime()) / 86400_000)),
  );

  // Leads
  const listingIds = all.map((l) => l.id);
  let activeLeads = 0;
  if (listingIds.length) {
    const { count } = await sb
      .from("vehicle_leads")
      .select("id", { count: "exact", head: true })
      .in("listing_id", listingIds)
      .not("status", "in", "(sold,closed,rejected)");
    activeLeads = count ?? 0;
  }

  const conversionRate = soldMonth.length + active.length > 0
    ? Math.round((soldMonth.length / (soldMonth.length + active.length)) * 1000) / 10
    : 0;

  const stale = [...active]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map((l) => ({
      id: l.id, title: l.title, brand: l.brand, model: l.model, year: l.year,
      price: l.price,
      days_online: Math.floor((now - new Date(l.created_at).getTime()) / 86400_000),
    }));

  const topMargin = [...sold]
    .filter((l) => l.sold_price != null && l.cost_price != null)
    .sort((a, b) => (b.sold_price! - b.cost_price!) - (a.sold_price! - a.cost_price!))
    .slice(0, 5)
    .map((l) => ({
      id: l.id, title: l.title, brand: l.brand, model: l.model, year: l.year,
      sold_price: l.sold_price, margin: (l.sold_price! - l.cost_price!),
    }));

  const attention = active
    .filter((l) => (now - new Date(l.created_at).getTime()) > 60 * 86400_000)
    .map((l) => ({
      id: l.id, title: l.title, price: l.price,
      days_online: Math.floor((now - new Date(l.created_at).getTime()) / 86400_000),
    }));

  // Insights
  const insights: string[] = [];
  if (attention.length) insights.push(`📦 ${attention.length} wagen${attention.length === 1 ? "" : "s"} staat langer dan 60 dagen online — overweeg een prijsherziening.`);
  if (soldMonth.length && soldPrev.length) {
    const delta = revenue(soldMonth) - revenue(soldPrev);
    const pct = soldPrev.length ? Math.round((delta / revenue(soldPrev)) * 100) : 0;
    if (Math.abs(pct) >= 5) {
      insights.push(`📈 Omzet deze maand is ${pct > 0 ? "+" : ""}${pct}% t.o.v. vorige maand.`);
    }
  }
  if (monthMargins.length) {
    insights.push(`💰 Gemiddelde marge deze maand: €${avg(monthMargins).toLocaleString("nl-BE")} per wagen.`);
  }
  // Top merk op marge
  const brandMargin: Record<string, number[]> = {};
  for (const l of sold) {
    if (l.sold_price != null && l.cost_price != null && l.brand) {
      brandMargin[l.brand] = brandMargin[l.brand] ?? [];
      brandMargin[l.brand].push(l.sold_price - l.cost_price);
    }
  }
  const bestBrand = Object.entries(brandMargin)
    .map(([brand, ms]) => ({ brand, avg: avg(ms), n: ms.length }))
    .filter((b) => b.n >= 2)
    .sort((a, b) => b.avg - a.avg)[0];
  if (bestBrand) {
    insights.push(`🏆 ${bestBrand.brand} levert je hoogste gemiddelde marge (€${bestBrand.avg.toLocaleString("nl-BE")}).`);
  }
  if (activeLeads > 0) {
    insights.push(`💬 Je hebt ${activeLeads} actieve lead${activeLeads === 1 ? "" : "s"} die wachten op opvolging.`);
  }
  if (sold.length === 0) {
    insights.push(`🚀 Markeer je eerste verkochte wagen om je SalesAI te activeren.`);
  }

  return {
    kpis: {
      revenue_today: revenue(soldToday),
      revenue_week: revenue(soldWeek),
      revenue_month: revenue(soldMonth),
      revenue_prev_month: revenue(soldPrev),
      sold_month_count: soldMonth.length,
      avg_sale_price: avg(soldMonth.map((s) => s.sold_price ?? s.price ?? 0)),
      avg_margin: avg(monthMargins),
      avg_margin_pct: avgMarginPct,
      gross_profit_month: sum(monthMargins),
      active_leads: activeLeads,
      active_listings: active.length,
      conversion_rate: conversionRate,
      avg_sale_time_days: avgSaleTime,
      avg_stock_age_days: avgStockAge,
    },
    insights,
    stale,
    top_margin: topMargin,
    attention,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const idOrResp = await requireAuth(req);
  if (idOrResp instanceof Response) return idOrResp;
  const id = idOrResp;

  if (!(await rateLimit(id, "dealer-summary", 30, 60))) {
    return jsonResponse({ error: "Te veel verzoeken." }, 429);
  }

  try {
    const summary = await buildDealerSummary(id.userId!);
    return jsonResponse(summary);
  } catch (e) {
    console.error("dealer-sales-summary error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Fout" }, 500);
  }
});
