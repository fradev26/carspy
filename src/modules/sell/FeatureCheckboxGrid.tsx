import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeatureItem } from './featureCatalog';

interface Props {
  items: FeatureItem[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function FeatureCheckboxGrid({ items, selected, onToggle }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const active = selected.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            aria-pressed={active}
            className={cn(
              'focus-ring flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors min-h-[48px]',
              active
                ? 'border-primary/40 bg-primary/5 text-foreground'
                : 'border-border/60 bg-card hover:bg-muted/40'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-md border transition-colors flex-shrink-0',
                active ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
