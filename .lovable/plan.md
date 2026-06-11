## Mobiele headericonen: cirkel → afgerond vierkant

In `src/layouts/Header.tsx` bij beide mobiele iconcontainers (profiel links, berichten rechts):

- Vervang `rounded-full` door `rounded-xl` (12px, conform de projectstandaard).
- Behoud alle overige styling: `h-10 w-10`, `bg-muted/60`, icoonmaat `h-[18px] w-[18px]`, `strokeWidth={1.75}`, positionering (`left-6` / `right-6`, `top-1/2 -translate-y-1/2`), `before:` tap-target pseudo-element.
- Unread-badge blijft `rounded-full` (badge zelf blijft rond) met `ring-2 ring-background`.
- Lege-staat container (geen ongelezen berichten) krijgt ook `rounded-xl` voor symmetrie.
- Desktop header en Sheet-inhoud blijven ongewijzigd.