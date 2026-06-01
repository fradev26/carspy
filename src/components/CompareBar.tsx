import { Link } from 'react-router-dom';
import { GitCompareArrows, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';
import { cn } from '@/lib/utils';

export function CompareBar() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-nav-above md:bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-lg shadow-elevated animate-in slide-in-from-bottom-4 duration-300 safe-x md:safe-bottom">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto">
          <GitCompareArrows className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex items-center gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm font-medium"
              >
                <span className="truncate max-w-[120px]">{item.title}</span>
                <button
                  onClick={() => remove(item.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {items.length}/3
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
            Wissen
          </Button>
          <Button asChild size="sm" disabled={items.length < 2}>
            <Link to="/vergelijken" className={cn(items.length < 2 && 'pointer-events-none opacity-50')}>
              Vergelijken ({items.length})
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
