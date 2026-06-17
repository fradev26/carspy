// Shared dealer KPI/summary builder used by dealer-sales-summary and chat (business context).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function avg(xs: number[]) {
  if (!xs.length) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}
function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

export type DealerSummary = Awaited<ReturnType<typeof buildDealerSummary>>;

export async function buildDealerSummary(userId: string) {
  const sb = admin();
  const { data: listings } = await sb
    .from("listings")
    .select("id,title,brand,model,year,price,cost_price,sold_price,sold_at,status,created_at,views")
    .eq("user_id", userId)
    .limit(2000);

  const all = listings ?? [];
  const active = all.filter((l: any) => l.status === "active");
  const sold = all.filter((l: any) => l.status === "sold" && l.sold_at);

  const now = Date.now();
  const inRange = (iso: string | null, days: number) =>
    iso ? (now - new Date(iso).getTime()) <= days * 86400_000 : false;

  const soldToday = sold.filter((l: any) => inRange(l.sold_at, 1));
  const soldWeek = sold.filter((l: any) => inRange(l.sold_at, 7));
  const soldMonth = sold.filter((l: any) => inRange(l.sold_at, 30));
  const soldPrev = sold.filter((l: any) =>
    l.sold_at && (now - new Date(l.sold_at).getTime()) > 30 * 86400_000
    && (now - new Date(l.sold_at).getTime()) <= 60 * 86400_000
  );

  const revenue = (rows: any[]) => sum(rows.map((r) => r.sold_price ?? r.price ?? 0));
  const margins = (rows: any[]) =>
    rows.filter((r) => r.sold_price != null && r.cost_price != null)
        .map((r) => (r.sold_price - r.cost_price));

  const monthMargins = margins(soldMonth);
  const avgMarginPct = (() => {
    const rows = soldMonth.filter((r: any) => r.sold_price && r.cost_price);
    if (!rows.length) return 0;
    const pcts = rows.map((r: any) => ((r.sold_price - r.cost_price) / r.sold_price) * 100);
    return Math.round((pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length) * 10) / 10;
  })();

  const avgSaleTime = avg(
    sold.filter((l: any) => l.sold_at && l.created_at).map((l: any) =>
      Math.floor((new Date(l.sold_at).getTime() - new Date(l.created_at).getTime()) / 86400_000)
    ),
  );
  const avgStockAge = avg(
    active.map((l: any) => Math.floor((now - new Date(l.created_at).getTime()) / 86400_000)),
  );

  const listingIds = all.map((l: any) => l.id);
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
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map((l: any) => ({
      id: l.id, title: l.title, brand: l.brand, model: l.model, year: l.year,
      price: l.price,
      days_online: Math.floor((now - new Date(l.created_at).getTime()) / 86400_000),
    }));

  const topMargin = [...sold]
    .filter((l: any) => l.sold_price != null && l.cost_price != null)
    .sort((a: any, b: any) => (b.sold_price - b.cost_price) - (a.sold_price - a.cost_price))
    .slice(0, 5)
    .map((l: any) => ({
      id: l.id, title: l.title, brand: l.brand, model: l.model, year: l.year,
      sold_price: l.sold_price, margin: (l.sold_price - l.cost_price),
    }));

  const attention = active
    .filter((l: any) => (now - new Date(l.created_at).getTime()) > 60 * 86400_000)
    .map((l: any) => ({
      id: l.id, title: l.title, price: l.price,
      days_online: Math.floor((now - new Date(l.created_at).getTime()) / 86400_000),
    }));

  const insights: string[] = [];
  if (attention.length) insights.push(`📦 ${attention.length} wagen${attention.length === 1 ? "" : "s"} staat langer dan 60 dagen online — overweeg een prijsherziening.`);
  if (soldMonth.length && soldPrev.length) {
    const delta = revenue(soldMonth) - revenue(soldPrev);
    const pct = revenue(soldPrev) ? Math.round((delta / revenue(soldPrev)) * 100) : 0;
    if (Math.abs(pct) >= 5) {
      insights.push(`📈 Omzet deze maand is ${pct > 0 ? "+" : ""}${pct}% t.o.v. vorige maand.`);
    }
  }
  if (monthMargins.length) {
    insights.push(`💰 Gemiddelde marge deze maand: €${avg(monthMargins).toLocaleString("nl-BE")} per wagen.`);
  }
  const brandMargin: Record<string, number[]> = {};
  for (const l of sold as any[]) {
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
      avg_sale_price: avg(soldMonth.map((s: any) => s.sold_price ?? s.price ?? 0)),
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

export function summaryToPrompt(summary: DealerSummary): string {
  const k = summary.kpis;
  const lines: string[] = [];
  lines.push(`## Dealer-context (laatste 30 dagen)`);
  lines.push(`- Omzet maand: €${k.revenue_month.toLocaleString("nl-BE")} (vorige maand €${k.revenue_prev_month.toLocaleString("nl-BE")})`);
  lines.push(`- Brutowinst maand: €${k.gross_profit_month.toLocaleString("nl-BE")} · marge ${k.avg_margin_pct}%`);
  lines.push(`- Verkocht maand: ${k.sold_month_count} wagens · gem. verkoopprijs €${k.avg_sale_price.toLocaleString("nl-BE")}`);
  lines.push(`- Actieve voorraad: ${k.active_listings} · actieve leads: ${k.active_leads}`);
  lines.push(`- Conversieratio: ${k.conversion_rate}% · gem. verkooptijd: ${k.avg_sale_time_days}d · gem. voorraadduur: ${k.avg_stock_age_days}d`);
  if (summary.insights.length) {
    lines.push(`\n### Insights`);
    summary.insights.forEach((i) => lines.push(`- ${i}`));
  }
  if (summary.stale.length) {
    lines.push(`\n### Langst stilstaand`);
    summary.stale.forEach((s) => lines.push(`- [${s.title}](/zakelijk/voorraad/${s.id}) · ${s.days_online}d · €${s.price?.toLocaleString("nl-BE")}`));
  }
  if (summary.top_margin.length) {
    lines.push(`\n### Hoogste marges (verkocht)`);
    summary.top_margin.forEach((s) => lines.push(`- ${s.brand} ${s.model} ${s.year} · verkoop €${s.sold_price?.toLocaleString("nl-BE")} · marge €${s.margin?.toLocaleString("nl-BE")}`));
  }
  return lines.join("\n");
}
