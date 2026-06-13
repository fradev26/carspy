import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_dealer: boolean;
  dealer_name: string | null;
  vat_number: string | null;
  company_website: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      // Use the security-definer RPC to fetch own profile including PII (email/phone/vat_number).
      // Direct .from('profiles').select('*') is blocked by column-level grants after S4 lockdown.
      const { data, error } = await supabase.rpc('get_my_profile');

      if (!error && data) {
        setProfile(data as unknown as Profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, isDealer: profile?.is_dealer ?? false };
}
