import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Inbox, Info, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useDealerLeads,
  filterLeads,
  leadListingTitles,
  paginateLeads,
  type DealerLead,
  type LeadStatus,
} from '@/hooks/useDealerLeads';
import { parseLeadsUrl, leadsUrlParams, type LeadsUrlState } from '@/lib/leadsUrl';
import { useDealerLeadsRealtime } from '@/hooks/useDealerLeadsRealtime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadKpiRow } from '@/components/dealer/leads/LeadKpiRow';
import { LeadFilters, type LeadTab } from '@/components/dealer/leads/LeadFilters';
import { LeadCard } from '@/components/dealer/leads/LeadCard';
import { LeadEmptyState } from '@/components/dealer/leads/LeadEmptyState';
import { VirtualGrid } from '@/components/VirtualGrid';
import { Can } from '@/components/auth/Can';

export default function Leads() {
  const { toast } = useToast();
  const perms = usePermissions();
  const { data: leads, isLoading, refetch } = useDealerLeads();
  useDealerLeadsRealtime();
  // Filters, sortering en infinite-scroll positie leven in de URL, zodat een
  // reload of gedeelde link de exacte context herstelt.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(() => parseLeadsUrl(searchParams), [searchParams]);
  const { tab, query, listing, period, sort, page: pageCount } = urlState;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<{ firstId: string | null; height: number }>({ firstId: null, height: 0 });

  const all = leads ?? [];

  const counts: Record<LeadTab, number> = useMemo(
    () => ({
      all: all.length,
      new: all.filter((l) => l.status === 'new').length,
      in_progress: all.filter((l) => l.status === 'in_progress').length,
      done: all.filter((l) => l.status === 'done').length,
    }),
    [all],
  );

  const listingOptions = useMemo(() => leadListingTitles(all), [all]);

  const filtered = useMemo(
    () => filterLeads(all, { status: tab, query, listing, period, sort }),
    [all, tab, query, listing, period, sort],
  );

  // Filterwijzigingen resetten naar pagina 1; paginanavigatie (infinite
  // scroll) behoudt alle filters. Realtime-refetches raken de URL niet,
  // waardoor pagina en scrollpositie behouden blijven.
  // Filterwijzigingen resetten naar pagina 1 en krijgen een eigen history-entry,
  // zodat browser back/forward tussen filtersets navigeert. Paginanavigatie
  // (infinite scroll) vervangt de entry, zodat één keer 'terug' niet elke
  // bijgeladen pagina moet afpellen. Realtime-refetches raken de URL niet.
  const updateUrl = (patch: Partial<LeadsUrlState>, resetPage = true) => {
    const next = { ...urlState, ...patch };
    if (resetPage) next.page = 1;
    setSearchParams(leadsUrlParams(next), { replace: !resetPage });
  };
  const setPageCount = (updater: (c: number) => number) =>
    updateUrl({ page: updater(pageCount) }, false);


  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: 'Link gekopieerd', description: 'De huidige filters en pagina staan op het klembord.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Kopiëren mislukt', description: 'Je browser blokkeert het klembord.', variant: 'destructive' });
    }
  };

  const paged = useMemo(() => paginateLeads(filtered, pageCount), [filtered, pageCount]);
  const visible = paged.visible;

  // Back/forward: de lijst is pas op de juiste hoogte zodra de data geladen is
  // en de pagina's uit de URL gerenderd zijn. Pas dan mag de scrollpositie uit
  // de history-entry hersteld worden.
  const restoreReady = !isLoading && (visible.length > 0 || filtered.length === 0);
  const restored = useScrollRestoration('leadsScrollY', restoreReady);



  // Infinite scroll: zodra de sentinel in beeld komt, een pagina bijladen.
  useEffect(() => {
    if (!paged.hasMore || typeof IntersectionObserver === 'undefined') return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setPageCount((c) => c + 1);
      },
      { rootMargin: '240px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [paged.hasMore]);

  // Scroll-anker: realtime leads worden via refetch in de juiste sorteervolgorde
  // ingevoegd. Wanneer er kaarten vóór de huidige eerste kaart bijkomen terwijl
  // die boven het viewport staat, compenseer dan zodat de zichtbare content
  // niet verspringt. Browser-anchoring is op de lijst uitgeschakeld (className)
  // om dubbele compensatie te vermijden.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const prev = anchorRef.current;
    const prevIndex = prev.firstId ? visible.findIndex((l) => l.id === prev.firstId) : -1;
    // Niet compenseren zolang de back/forward-restauratie nog moet gebeuren.
    if (restored.current && prev.firstId && prevIndex > 0 && el.getBoundingClientRect().top < 0) {
      const delta = el.offsetHeight - prev.height;
      if (delta > 0) window.scrollBy({ top: delta });
    }
    anchorRef.current = { firstId: visible[0]?.id ?? null, height: el.offsetHeight };
  }, [visible, restored]);


  const hasFilters = query.trim().length > 0 || listing !== '' || period !== 'all' || tab !== 'all';


  const handleStatus = async (leadId: string, status: LeadStatus) => {
    setBusyId(leadId);
    // Gespreksleads slaan hun status op in conversations via een beveiligde RPC;
    // contactaanvragen direct in dealer_leads.
    const { error } = leadId.startsWith('conv-')
      ? await supabase.rpc('set_conversation_status', {
          _conversation_id: leadId.slice('conv-'.length),
          _status: status,
        })
      : await supabase
          .from('dealer_leads')
          .update({ status })
          .eq('id', leadId);
    setBusyId(null);
    if (error) {
      toast({ title: 'Status niet opgeslagen', description: error.message, variant: 'destructive' });
      return;
    }
    await refetch();
    toast({ title: 'Status bijgewerkt' });
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Alle koper- en contactverzoeken op één plek.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={copyShareUrl}
          aria-label="Deel huidige filters"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
          {copied ? 'Gekopieerd' : 'Link kopiëren'}
        </Button>
      </div>

      <Can do="canViewLeads" fallback={
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" /> Enkel de eigenaar, beheerder of verkoper van het bedrijf kan leads bekijken.
        </div>
      }>
        <LeadKpiRow leads={all} />

        <LeadFilters
          value={{ tab, query, listing, period, sort }}
          onChange={(v) =>
            updateUrl({ tab: v.tab, query: v.query, listing: v.listing, period: v.period, sort: v.sort })
          }
          counts={counts}
          listings={listingOptions}
        />

        {visible.length === 0 ? (
          <LeadEmptyState hasQuery={hasFilters} />

        ) : (
          <>
            <div ref={listRef} className="[overflow-anchor:none] [&_*]:[overflow-anchor:none]">
              <VirtualGrid
                items={visible}
                columns={[1, 1, 1]}
                estimateRowHeight={168}
                renderItem={(lead: DealerLead) => (
                  <LeadCard lead={lead} onStatusChange={handleStatus} busy={busyId === lead.id} />
                )}
                getKey={(lead) => lead.id}
              />
            </div>
            {paged.hasMore && (
              <div ref={sentinelRef} className="flex justify-center pt-1">
                <Button variant="outline" onClick={() => setPageCount((c) => c + 1)}>
                  Toon meer leads ({paged.remaining} resterend)
                </Button>
              </div>
            )}
          </>
        )}
      </Can>
    </div>
  );
}
