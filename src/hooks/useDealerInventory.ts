import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PAGE_SIZE } from '@/lib/keyset';
import type { ListingAnalytics, DealerOverview } from '@/hooks/useDealerAnalytics';

export interface DealerInventoryPage {
  overview: DealerOverview;
  statusCounts: Record<string, number>;
  listings: ListingAnalytics[];
  nextCursor: string | null;
  total: number;
}

export interface DealerInventoryRequest {
  cursor?: string | null;
  limit?: number;
  query?: string;
  statuses?: string[];
}

/**
 * Cursor-based fetch of one batch of the dealer inventory feed.
 * Same request/response contract as the consumer search feed:
 * { cursor, limit, ...filters } -> { items, nextCursor, total }.
 */
export async function fetchDealerInventoryPage(
  req: DealerInventoryRequest,
): Promise<DealerInventoryPage> {
  const { data, error } = await supabase.functions.invoke('dealer-analytics', {
    body: {
      cursor: req.cursor ?? null,
      limit: req.limit ?? DEFAULT_PAGE_SIZE,
      query: req.query ?? '',
      statuses: req.statuses ?? [],
    },
  });
  if (error) throw new Error(error.message ?? 'Kon voorraad niet laden');
  return data as DealerInventoryPage;
}

/** Infinite (cursor-based) dealer inventory feed. */
export function useDealerInventoryInfinite(params: {
  query?: string;
  statuses?: string[];
  limit?: number;
}) {
  const { user } = useAuth();
  const { query = '', statuses = [], limit = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery<DealerInventoryPage>({
    queryKey: ['dealer-inventory', { userId: user?.id, query, statuses, limit }],
    enabled: !!user,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchDealerInventoryPage({ cursor: pageParam as string | null, limit, query, statuses }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const listings = result.data?.pages.flatMap((p) => p.listings) ?? [];
  const first = result.data?.pages[0];

  return {
    ...result,
    listings,
    overview: first?.overview ?? null,
    statusCounts: first?.statusCounts ?? {},
    total: first?.total ?? 0,
  };
}
