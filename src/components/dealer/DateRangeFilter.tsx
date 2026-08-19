import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  type AnalyticsRange,
  customRange,
  formatRangeLabel,
  fromDayKey,
  presetRange,
} from '@/lib/dateRange';

const PRESETS: (7 | 30 | 90)[] = [7, 30, 90];

interface Props {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>({
    from: fromDayKey(value.from),
    to: fromDayKey(value.to),
  });

  const applyCustom = () => {
    if (draft?.from) {
      onChange(customRange(draft.from, draft.to ?? draft.from));
      setOpen(false);
    }
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ''}`} role="group" aria-label="Periode kiezen">
      {PRESETS.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={value.preset === p ? 'default' : 'outline'}
          onClick={() => onChange(presetRange(p))}
          aria-pressed={value.preset === p}
        >
          {p}d
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.preset === 'custom' ? 'default' : 'outline'}
            aria-pressed={value.preset === 'custom'}
            aria-label="Aangepaste periode kiezen"
          >
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            {value.preset === 'custom' ? formatRangeLabel(value) : 'Aangepast'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={draft}
            onSelect={setDraft}
            disabled={{ after: new Date() }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          <div className="flex justify-end gap-2 border-t border-border p-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button size="sm" onClick={applyCustom} disabled={!draft?.from}>Toepassen</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
