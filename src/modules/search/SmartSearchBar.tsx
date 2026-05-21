import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSmartSearch, filtersToParams } from '@/hooks/useSmartSearch';
import { cn } from '@/lib/utils';


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
          'flex items-center gap-2 rounded-md border-2 border-primary/30 bg-background p-2 shadow-floating focus-within:border-primary/60 transition-colors',
          variant === 'hero' ? 'p-3' : 'p-2'
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Beschrijf je droomwagen…"
            disabled={loading}
            className="flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Slim zoeken"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">{loading ? 'Begrijpt…' : 'Vind mijn auto'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
