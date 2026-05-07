import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSmartSearch, filtersToParams } from '@/hooks/useSmartSearch';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  'Rode BMW SUV onder 20.000 euro',
  'Zuinige gezinswagen met automaat',
  'Elektrische stadswagen met lage km',
  'Mercedes met veel pk en automaat',
];

interface Props {
  className?: string;
  variant?: 'hero' | 'compact';
}

export function SmartSearchBar({ className, variant = 'hero' }: Props) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { search, loading } = useSmartSearch();

  const submit = async (e?: FormEvent, override?: string) => {
    e?.preventDefault();
    const q = (override ?? query).trim();
    if (!q || loading) return;
    const result = await search(q);
    if (!result) return;
    const params = filtersToParams(result.filters);
    if (result.intent) params.set('aiIntent', result.intent);
    params.set('aiQuery', q);
    navigate(`/zoeken?${params.toString()}`);
  };

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={submit}>
        <div className={cn(
          'flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-background p-2 shadow-floating focus-within:border-primary/60 transition-colors',
          variant === 'hero' ? 'p-3' : 'p-2'
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Beschrijf je droomwagen… bv. 'rode BMW SUV onder 20.000 euro'"
            disabled={loading}
            className="flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Slim zoeken"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-10 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow-accent font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">{loading ? 'Begrijpt…' : 'Vind mijn auto'}</span>
          </Button>
        </div>
      </form>

      {variant === 'hero' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-1">Voorbeelden:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setQuery(ex); submit(undefined, ex); }}
              disabled={loading}
              className="rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs text-foreground/70 hover:border-primary/50 hover:text-foreground transition-colors focus-ring disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
