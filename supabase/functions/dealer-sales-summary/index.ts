import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse, requireAuth, rateLimit } from "../_shared/ai-guard.ts";
import { buildDealerSummary } from "../_shared/dealer-summary.ts";

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
