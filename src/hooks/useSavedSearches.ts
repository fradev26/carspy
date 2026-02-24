import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SearchFilters } from '@/types/listing';

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_searches')
      .select('id, name, filters, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedSearches(data.map(d => ({
        ...d,
        filters: (d.filters as unknown) as SearchFilters,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (name: string, filters: SearchFilters) => {
    if (!user) {
      toast({ title: 'Log in om zoekopdrachten op te slaan', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('saved_searches')
      .insert({ user_id: user.id, name, filters: filters as any });

    if (error) {
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    } else {
      toast({ title: 'Zoekopdracht opgeslagen!' });
      fetch();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (!error) {
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Zoekopdracht verwijderd' });
    }
  };

  return { savedSearches, loading, save, remove, refetch: fetch };
}
