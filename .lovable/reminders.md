# Open Reminders

## Productframework = source of truth
`docs/product/PRODUCTFRAMEWORK.md` (juli 2026) is leidend voor alle feature-werk. Elke PR/feature verwijst naar het A#/B#-nummer uit het framework. Bij conflict met bestaande code wint het framework — behalve waar werkende functionaliteit expliciet niet strijdig is. Zie `docs/product/BACKLOG.md` voor de gefaseerde backlog en `docs/product/OPEN_QUESTIONS.md` voor openstaande beslispunten.


## Handmatige E2E rooktest (uitgesteld op 16 juni 2026)
Loop `.lovable/sprint2-smoketest.md` door vóór hard-launch:
1. Register → Login → Logout
2. Wachtwoord reset (via /wachtwoord-reset met PKCE)
3. Sell wizard end-to-end
4. Favorites + Compare
5. Buyer/Seller messaging (Realtime)
6. Search met filters + paginatie
7. AI flows (chat, vehicle analysis, ad generator)

**Herinner de gebruiker hier expliciet aan** bij:
- volgende publish-vraag
- afronding van Sprint 3
- elke launch-readiness re-score
