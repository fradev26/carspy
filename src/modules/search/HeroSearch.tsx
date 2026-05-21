import { useState } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import { SmartSearchBar } from './SmartSearchBar';
import { ClassicHeroSearch } from './ClassicHeroSearch';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

type Mode = 'smart' | 'classic';

export function HeroSearch({ className }: Props) {
  const [mode, setMode] = useState<Mode>('smart');

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      {/* Segmented toggle */}
      <div
        role="tablist"
        aria-label="Zoekmodus"
        className="mb-4 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md"
      >
        <button
          role="tab"
          aria-selected={mode === 'smart'}
          type="button"
          onClick={() => setMode('smart')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all focus-ring',
            mode === 'smart'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          )}
        >
          <Sparkles className="h-4 w-4" />
          Slim zoeken
        </button>
        <button
          role="tab"
          aria-selected={mode === 'classic'}
          type="button"
          onClick={() => setMode('classic')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all focus-ring',
            mode === 'classic'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Klassiek zoeken
        </button>
      </div>

      {/* Shared container — min-height prevents layout shift between modes */}
      <div className="w-full glass rounded-2xl p-4 md:p-6 shadow-floating min-h-[180px] md:min-h-[112px] flex items-center">
        {mode === 'smart' ? (
          <div className="w-full animate-fade-in">
            <SmartSearchBar variant="hero" />
          </div>
        ) : (
          <div className="w-full animate-fade-in">
            <ClassicHeroSearch />
          </div>
        )}
      </div>
    </div>
  );
}
