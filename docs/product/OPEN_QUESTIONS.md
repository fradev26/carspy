# Open beslispunten

Punten die de business owner moet bevestigen vóór implementatie. Uit [`PRODUCTFRAMEWORK.md`](./PRODUCTFRAMEWORK.md) §8.

| # | Vraag | Impact | Nodig voor |
|---|---|---|---|
| Q1 | Welke 2–3 DMS/feedformaten prioriteren voor BE-dealers? | Bepaalt integratievolgorde en migratietool | B8, A3.2 (Pre-pilot) |
| Q2 | Car-Pass: API-toegang of handmatige vermelding per voertuig? | Bepaalt implementatie vertrouwenslaag | B7 (Pilot) |
| Q3 | Telefoontracking voor leads: eigen nummer-proxy of externe dienst? | Nodig om leadwaarde aan dealers te bewijzen | A2.5, A3.3 |
| Q4 | FR-activatietiming: al in Pilot of pas bij Commerciële Lancering? | Bepaalt scope FR-i18n en AI-copy | A1.8, B4 |
| Q5 | Techstack MVP: welke onderdelen herbouwen vs. uitbouwen? | Input voor Full Stack-wervingsbrief | Sprint 0 |

## Aannames tot bevestiging

Tot deze punten bevestigd zijn, hanteert de assistent de volgende default-aannames — expliciet gemarkeerd als `[TE BEVESTIGEN]` in code en docs:

- **DMS**: `autoscout-sync` blijft de referentie-implementatie; nieuwe importers pas na Q1.
- **Car-Pass**: handmatige velden op listing tot API bevestigd (Q2).
- **Telefoontracking**: geen tracking-proxy; `tel:`-links met click-event-logging naar `marketing_events`.
- **FR**: i18n-scaffold voorbereiden, activatie pas na Q4.
