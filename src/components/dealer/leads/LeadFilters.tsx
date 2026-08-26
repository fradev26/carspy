import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { LeadPeriod, LeadSort } from '@/hooks/useDealerLeads';

export type LeadTab = 'all' | 'new' | 'in_progress' | 'done';

export interface LeadFiltersValue {
  tab: LeadTab;
  query: string;
  /** Advertentietitel; lege string = alle advertenties. */
  listing: string;
  period: LeadPeriod;
  sort: LeadSort;
}

const TABS: { key: LeadTab; label: string }[] = [
  { key: 'all', label: 'Alles' },
  { key: 'new', label: 'Nieuw' },
  { key: 'in_progress', label: 'In behandeling' },
  { key: 'done', label: 'Afgehandeld' },
];

const PERIODS: { key: LeadPeriod; label: string }[] = [
  { key: 'all', label: 'Alle periodes' },
  { key: 'today', label: 'Vandaag' },
  { key: '7d', label: 'Laatste 7 dagen' },
  { key: '30d', label: 'Laatste 30 dagen' },
];

const SORTS: { key: LeadSort; label: string }[] = [
  { key: 'newest', label: 'Nieuwste eerst' },
  { key: 'oldest', label: 'Oudste eerst' },
  { key: 'name', label: 'Naam A→Z' },
];

export function LeadFilters({
  value,
  onChange,
  counts,
  listings,
}: {
  value: LeadFiltersValue;
  onChange: (v: LeadFiltersValue) => void;
  counts: Record<LeadTab, number>;
  listings: string[];
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

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={value.listing === '' ? 'all' : value.listing}
          onValueChange={(v) => onChange({ ...value, listing: v === 'all' ? '' : v })}
        >
          <SelectTrigger aria-label="Filter op advertentie" className="w-full">
            <SelectValue placeholder="Alle advertenties" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Alle advertenties</SelectItem>
            {listings.map((title) => (
              <SelectItem key={title} value={title}>{title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.period} onValueChange={(v) => onChange({ ...value, period: v as LeadPeriod })}>
          <SelectTrigger aria-label="Filter op periode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.sort} onValueChange={(v) => onChange({ ...value, sort: v as LeadSort })}>
          <SelectTrigger aria-label="Sorteer leads" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
