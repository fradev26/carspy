import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DealerSummary = {
  kpis: {
    revenue_today: number;
    revenue_week: number;
    revenue_month: number;
    revenue_prev_month: number;
    sold_month_count: number;
    avg_sale_price: number;
    avg_margin: number;
    avg_margin_pct: number;
    gross_profit_month: number;
    active_leads: number;
    active_listings: number;
    conversion_rate: number;
    avg_sale_time_days: number;
    avg_stock_age_days: number;
  };
  insights: string[];
  stale: Array<{ id: string; title: string; brand: string; model: string; year: number; price: number; days_online: number }>;
  top_margin: Array<{ id: string; title: string; brand: string; model: string; year: number; sold_price: number; margin: number }>;
  attention: Array<{ id: string; title: string; price: number; days_online: number }>;
};

export function useDealerSummary() {
  return useQuery<DealerSummary>({
    queryKey: ['dealer-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dealer-sales-summary');
      if (error) throw error;
      return data as DealerSummary;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
