import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildInternalDealerLead } from "./leadPayload.ts";

Deno.test("public dealer request stays internal and cannot assign an owner", () => {
  const payload = buildInternalDealerLead({
    name: "Test Koper",
    email: "koper@example.com",
    phone: null,
    company: "Voorbeeld BV",
    message: "Ik wil een demo.",
  });

  assertEquals(payload.source, "dealers_page_ai");
  assertEquals(payload.listing_id, null);
  assertEquals(payload.dealer_user_id, null);
  assertEquals(payload.company_id, null);
});