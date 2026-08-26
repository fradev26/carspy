import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type LeadTab = 'all' | 'new' | 'in_progress' | 'done';

export interface LeadFiltersValue {
  tab: LeadTab;
  query: string;
}

const TABS: { key: LeadTab; label: string }[] = [
  { key: 'all', label: 'Alles' },
  { key: 'new', label: 'Nieuw' },
  { key: 'in_progress', label: 'In behandeling' },
  { key: 'done', label: 'Afgehandeld' },
];

export function LeadFilters({
  value,
  onChange,
  counts,
}: {
  value: LeadFiltersValue;
  onChange: (v: LeadFiltersValue) => void;
  counts: Record<LeadTab, number>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          aria-label="Zoek in leads"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Zoek op naam, bedrijf of wagen…"
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Badge
            key={t.key}
            variant={value.tab === t.key ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer select-none px-3 py-1.5 text-sm font-medium',
              value.tab !== t.key && 'bg-background text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onChange({ ...value, tab: t.key })}
          >
            {t.label}
            <span className="ml-1.5 opacity-70">{counts[t.key]}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
