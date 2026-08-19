import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DealerReview {
  id: string;
  dealer_user_id: string;
  author_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  authorName?: string;
  authorAvatar?: string;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function summarize(reviews: DealerReview[]): ReviewSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummary['distribution'];
  for (const r of reviews) {
    const key = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[key] += 1;
  }
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
  return { average, count, distribution };
}

export function useDealerReviews(dealerUserId?: string) {
  return useQuery<DealerReview[]>({
    queryKey: ['dealer-reviews', dealerUserId],
    enabled: !!dealerUserId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealer_reviews' as any)
        .select('id, dealer_user_id, author_id, rating, title, body, created_at')
        .eq('dealer_user_id', dealerUserId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as unknown as DealerReview[];
      if (rows.length === 0) return rows;

      const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
      const { data: profs } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name, avatar_url')
        .in('id', authorIds);
      const byId = new Map(
        ((profs ?? []) as unknown as Array<{ id: string; full_name: string | null; avatar_url: string | null }>).map(
          (p) => [p.id, p],
        ),
      );
      return rows.map((r) => ({
        ...r,
        authorName: byId.get(r.author_id)?.full_name ?? 'VATUUR-gebruiker',
        authorAvatar: byId.get(r.author_id)?.avatar_url ?? undefined,
      }));
    },
  });
}

export interface ReviewInput {
  dealerUserId: string;
  rating: number;
  title?: string;
  body?: string;
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealerUserId, rating, title, body }: ReviewInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const authorId = auth.user?.id;
      if (!authorId) throw new Error('Meld je aan om een review te plaatsen.');
      if (authorId === dealerUserId) throw new Error('Je kan geen review over jezelf schrijven.');
      const { error } = await supabase.from('dealer_reviews' as any).upsert(
        {
          dealer_user_id: dealerUserId,
          author_id: authorId,
          rating,
          title: title?.trim() || null,
          body: body?.trim() || null,
        } as any,
        { onConflict: 'dealer_user_id,author_id' },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['dealer-reviews', vars.dealerUserId] }),
  });
}
