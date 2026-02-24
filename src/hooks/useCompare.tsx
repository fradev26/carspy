import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Listing } from '@/types/listing';
import { toast } from '@/hooks/use-toast';

const MAX_COMPARE = 3;

interface CompareContextType {
  items: Listing[];
  add: (listing: Listing) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Listing[]>([]);

  const add = useCallback((listing: Listing) => {
    setItems(prev => {
      if (prev.length >= MAX_COMPARE) {
        toast({ title: `Maximaal ${MAX_COMPARE} auto's vergelijken`, variant: 'destructive' });
        return prev;
      }
      if (prev.some(i => i.id === listing.id)) return prev;
      toast({ title: `${listing.title} toegevoegd aan vergelijking` });
      return [...prev, listing];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((id: string) => items.some(i => i.id === id), [items]);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has, isFull: items.length >= MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
