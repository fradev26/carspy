import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type BulkAction = 'pause' | 'reactivate' | 'sold';

const ACTION_LABEL: Record<BulkAction, string> = {
  pause: 'Pauzeren',
  reactivate: 'Heractiveren',
  sold: 'Markeer als verkocht',
};

const ACTION_DESC: Record<BulkAction, string> = {
  pause: 'Tijdelijk uit de zoekresultaten halen (status wordt Concept).',
  reactivate: 'Concept- of verborgen advertenties opnieuw publiceren als Actief.',
  sold: 'Markeer de geselecteerde wagens als verkocht.',
};

const TARGET_STATUS: Record<BulkAction, string> = {
  pause: 'draft',
  reactivate: 'active',
  sold: 'sold',
};

export function BulkActionDialog({
  open,
  onOpenChange,
  action,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: BulkAction | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['bulk-listings', user?.id, action],
    enabled: open && !!user && !!action,
    queryFn: async () => {
      const query = supabase
        .from('listings')
        .select('id, title, brand, model, year, price, status')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleAll = () => {
    if (!listings) return;
    if (selected.size === listings.length) setSelected(new Set());
    else setSelected(new Set(listings.map((l) => l.id)));
  };

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const submit = async () => {
    if (!action || selected.size === 0) return;
    setSubmitting(true);
    const patch: Record<string, unknown> = { status: TARGET_STATUS[action] };
    if (action === 'sold') patch.sold_at = new Date().toISOString();
    const { error } = await supabase
      .from('listings')
      .update(patch)
      .in('id', Array.from(selected));
    setSubmitting(false);
    if (error) {
      toast.error(`Bulkactie mislukt: ${error.message}`);
      return;
    }
    toast.success(`${selected.size} advertentie(s) bijgewerkt`);
    qc.invalidateQueries({ queryKey: ['bulk-listings'] });
    qc.invalidateQueries({ queryKey: ['active-listings-count'] });
    setSelected(new Set());
    onOpenChange(false);
  };

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{ACTION_LABEL[action]}</DialogTitle>
          <DialogDescription>{ACTION_DESC[action]}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary-strong" />
            </div>
          ) : !listings || listings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Geen advertenties beschikbaar.
            </p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer py-1">
                <Checkbox
                  checked={selected.size === listings.length && listings.length > 0}
                  onCheckedChange={toggleAll}
                />
                Selecteer alles ({listings.length})
              </label>
              {listings.map((l) => (
                <Card key={l.id} className="p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={selected.has(l.id)}
                      onCheckedChange={() => toggle(l.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.brand} {l.model} · {l.year} ·{' '}
                        <span className="capitalize">{l.status}</span>
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      € {l.price.toLocaleString('nl-BE')}
                    </p>
                  </label>
                </Card>
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={submitting || selected.size === 0}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {ACTION_LABEL[action]} ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { BulkAction };
