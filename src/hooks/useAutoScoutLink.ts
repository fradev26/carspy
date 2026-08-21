import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Geeft aan of de ingelogde dealer een AutoScout24-koppeling heeft. */
export function useAutoScoutLink() {
  const { user } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsLinked(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('autoscout_credentials')
      .select('customer_id, last_sync_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsLinked(Boolean(data?.customer_id));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isLinked, loading };
}
