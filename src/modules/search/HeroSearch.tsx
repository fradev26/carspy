import { useState } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SearchBar } from './SearchBar';
import { SmartSearchBar } from './SmartSearchBar';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function HeroSearch({ className }: Props) {
  const [tab, setTab] = useState<'smart' | 'classic'>('smart');

  return (
    <div className={cn('w-full', className)}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'smart' | 'classic')}>
        <TabsList className="mb-3 grid w-full max-w-md grid-cols-2 bg-background/30 backdrop-blur border border-white/20">
          <TabsTrigger value="smart" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground text-white/90">
            <Sparkles className="h-4 w-4" />
            Slim zoeken
          </TabsTrigger>
          <TabsTrigger value="classic" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground text-white/90">
            <SlidersHorizontal className="h-4 w-4" />
            Klassiek
          </TabsTrigger>
        </TabsList>
        <TabsContent value="smart" className="mt-0">
          <div className="glass rounded-2xl p-6 shadow-floating">
            <SmartSearchBar variant="hero" />
          </div>
        </TabsContent>
        <TabsContent value="classic" className="mt-0">
          <SearchBar variant="hero" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
