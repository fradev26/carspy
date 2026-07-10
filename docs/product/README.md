# VATUUR Product Docs

**Single source of truth voor productontwikkeling.** Bij conflict tussen deze documenten en bestaande implementatie: **dit document wint** en de code wordt bijgestuurd (behalve waar werkende functionaliteit expliciet niet in strijd is).

## Index

- [`PRODUCTFRAMEWORK.md`](./PRODUCTFRAMEWORK.md) — het leidende framework (juli 2026): drie lagen, MoSCoW-tabellen A1–A4 en B1–B9, fasering, guardrails.
- [`MVP_AUDIT.md`](./MVP_AUDIT.md) — huidige MVP-status per A/B-item met codepointers.
- [`BACKLOG.md`](./BACKLOG.md) — geprioriteerde backlog per fase (Pre-pilot / Pilot / Lancering / Opschaling).
- [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) — punten die de business owner moet beslissen.

## Werkregels voor de developer én de AI-assistent

1. Elk PR/feature refereert naar het A#/B#-nummer uit `PRODUCTFRAMEWORK.md`.
2. Features die in §5 ("Bewust NIET bouwen") staan worden niet voorgesteld of gebouwd vóór commerciële lancering.
3. Feature-implementaties die van dit framework afwijken vereisen expliciete goedkeuring.
4. Bij twijfel over prioriteit → MoSCoW-kolom in het framework raadplegen; bij twijfel over timing → fase-kolom.
