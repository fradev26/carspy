import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  LeadAssignee, LeadFocus, LeadPeriod, LeadSort, LeadTab,
} from '@/hooks/useDealerLeads';

export interface LeadFiltersValue {
  tab: LeadTab;
  query: string;
  /** Advertentietitel; lege string = alle advertenties. */
  listing: string;
  period: LeadPeriod;
  sort: LeadSort;
  assignee: string;
  source: string;
  country: string;
  unansweredOnly: boolean;
  focus: LeadFocus;
}

const TABS: { key: LeadTab; label: string }[] = [
  { key: 'action', label: 'Actie nodig' },
  { key: 'in_progress', label: 'In behandeling' },
  { key: 'waiting_customer', label: 'Wachten op klant' },
  { key: 'scheduled', label: 'Gepland' },
  { key: 'done', label: 'Afgehandeld' },
  { key: 'all', label: 'Alles' },
];

const PERIODS: { key: LeadPeriod; label: string }[] = [
  { key: 'all', label: 'Alle periodes' },
  { key: 'today', label: 'Vandaag' },
  { key: '7d', label: 'Laatste 7 dagen' },
  { key: '30d', label: 'Laatste 30 dagen' },
];

const SORTS: { key: LeadSort; label: string }[] = [
  { key: 'priority', label: 'Prioriteit' },
  { key: 'newest', label: 'Nieuwste eerst' },
  { key: 'longest_unanswered', label: 'Langst onbeantwoord' },
  { key: 'followup', label: 'Opvolging vandaag' },
  { key: 'intent', label: 'Hoogste koopintentie' },
];

const SOURCE_LABELS: Record<string, string> = {
  bericht: 'Bericht',
  contact_form: 'Contactformulier',
  'mock-seed': 'Import',
};

const FOCUS_LABELS: Record<Exclude<LeadFocus, ''>, string> = {
  new: 'Nieuwe leads',
  waiting: 'Wacht langer dan 24 u',
  followups: 'Opvolgingen vandaag',
};

export function LeadFilters({
  value,
  onChange,
  counts,
  listings,
  assignees,
  sources,
  countries,
}: {
  value: LeadFiltersValue;
  onChange: (v: LeadFiltersValue) => void;
  counts: Record<LeadTab, number>;
  listings: string[];
  assignees: LeadAssignee[];
  sources: string[];
  countries: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Statustabs met tellers */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Leadstatus">
        {TABS.map((t) => (
          <Badge
            key={t.key}
            role="tab"
            aria-selected={value.tab === t.key}
            tabIndex={0}
            variant={value.tab === t.key ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer select-none px-3 py-1.5 text-sm font-medium',
              value.tab !== t.key && 'bg-background text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onChange({ ...value, tab: t.key })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange({ ...value, tab: t.key });
              }
            }}
          >
            {t.label}
            <span className="ml-1.5 opacity-70">{counts[t.key]}</span>
          </Badge>
        ))}
      </div>

      {/* Zoeken op naam, e-mail, telefoon of voertuig */}
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          aria-label="Zoek in leads"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Zoek op naam, e-mail, telefoon of voertuig…"
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {/* Filters + sortering */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
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

        <Select
          value={value.assignee === '' ? 'all' : value.assignee}
          onValueChange={(v) => onChange({ ...value, assignee: v === 'all' ? '' : v })}
        >
          <SelectTrigger aria-label="Filter op verkoper" className="w-full">
            <SelectValue placeholder="Alle verkopers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle verkopers</SelectItem>
            <SelectItem value="none">Niet toegewezen</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.source === '' ? 'all' : value.source}
          onValueChange={(v) => onChange({ ...value, source: v === 'all' ? '' : v })}
        >
          <SelectTrigger aria-label="Filter op bron" className="w-full">
            <SelectValue placeholder="Alle bronnen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle bronnen</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>{SOURCE_LABELS[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.country === '' ? 'all' : value.country}
          onValueChange={(v) => onChange({ ...value, country: v === 'all' ? '' : v })}
        >
          <SelectTrigger aria-label="Filter op land" className="w-full">
            <SelectValue placeholder="Alle landen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle landen</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
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

      {/* Extra toggles */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={value.unansweredOnly}
            onCheckedChange={(checked) => onChange({ ...value, unansweredOnly: checked === true })}
            aria-label="Alleen onbeantwoorde leads"
          />
          Alleen onbeantwoord
        </label>

        {value.focus && (
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
            {FOCUS_LABELS[value.focus]}
            <button
              type="button"
              aria-label="Focusfilter wissen"
              className="rounded-full focus-ring"
              onClick={() => onChange({ ...value, focus: '' })}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </div>
  );
}
