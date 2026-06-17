type Chip = { label: string; prompt: string };

const CHIPS: Chip[] = [
  { label: 'Welke wagens afprijzen?', prompt: 'Welke wagens moet ik afprijzen om sneller te verkopen?' },
  { label: 'Top verkopers', prompt: 'Welke merken en modellen leveren mij de hoogste marge?' },
  { label: 'Schrijf advertentie', prompt: 'Help me een sterke advertentietekst schrijven voor mijn nieuwste wagen.' },
  { label: 'Voorraadanalyse', prompt: 'Geef me een korte voorraadanalyse en concrete acties.' },
  { label: 'Lead-opvolging', prompt: 'Wat is de beste manier om mijn openstaande leads op te volgen?' },
];

export function QuickChips({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((c) => (
        <button
          key={c.label}
          onClick={() => onPick(c.prompt)}
          className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-95"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
