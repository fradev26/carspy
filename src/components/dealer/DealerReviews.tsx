import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquareQuote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useDealerReviews, useSubmitReview, summarize } from '@/hooks/useDealerReviews';

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} van 5 sterren`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i <= Math.round(value) ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** Reviews en beoordelingsformulier op /dealer/:slug (A2.4). */
export function DealerReviews({ dealerUserId, dealerName }: { dealerUserId?: string; dealerName: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews, isLoading } = useDealerReviews(dealerUserId);
  const submit = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const summary = summarize(reviews ?? []);
  const own = reviews?.find((r) => r.author_id === user?.id);
  const isOwnDealerPage = !!user && user.id === dealerUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerUserId) return;
    if (rating < 1) {
      toast({ title: 'Kies een score', description: 'Geef minstens één ster.', variant: 'destructive' });
      return;
    }
    try {
      await submit.mutateAsync({ dealerUserId, rating, title, body });
      toast({ title: 'Bedankt voor je review' });
      setFormOpen(false);
      setTitle('');
      setBody('');
    } catch (err) {
      toast({
        title: 'Review niet opgeslagen',
        description: err instanceof Error ? err.message : 'Probeer het later opnieuw.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <MessageSquareQuote className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Reviews over {dealerName}
          </h2>
          {!isOwnDealerPage && (
            user ? (
              <Button size="sm" variant="outline" onClick={() => { setFormOpen((v) => !v); setRating(own?.rating ?? 0); }}>
                {own ? 'Review bewerken' : 'Review schrijven'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to="/auth">Log in om te reviewen</Link>
              </Button>
            )
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : summary.count === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nog geen reviews. Kocht je hier een wagen? Deel je ervaring en help andere kopers.
          </p>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-bold">{summary.average?.toFixed(1)}</span>
              <div>
                <Stars value={summary.average ?? 0} />
                <p className="text-xs text-muted-foreground">
                  {summary.count} review{summary.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {reviews!.slice(0, 5).map((r) => (
                <li key={r.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.authorName}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.title && <p className="mt-1 text-sm font-semibold">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{r.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('nl-BE')}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-border/60 p-3">
            <fieldset>
              <legend className="text-sm font-medium">Jouw score</legend>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    aria-label={`${i} ster${i === 1 ? '' : 'ren'}`}
                    aria-pressed={rating === i}
                    className="focus-ring rounded p-0.5"
                  >
                    <Star className={cn('h-6 w-6', i <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/40')} />
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="review-title" className="text-sm font-medium">Titel (optioneel)</label>
              <Input
                id="review-title"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vlotte overname, correcte wagen"
              />
            </div>
            <div>
              <label htmlFor="review-body" className="text-sm font-medium">Je ervaring (optioneel)</label>
              <Textarea
                id="review-body"
                rows={4}
                value={body}
                maxLength={2000}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hoe verliep het contact, de proefrit en de overdracht?"
              />
            </div>
            <Button type="submit" size="sm" disabled={submit.isPending}>
              {submit.isPending ? 'Opslaan…' : 'Review publiceren'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
