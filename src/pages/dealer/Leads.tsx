import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Inbox, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadCard } from '@/components/dealer/leads/LeadCard';
import { LeadFilters } from '@/components/dealer/leads/LeadFilters';
import { LeadPriorityBar } from '@/components/dealer/leads/LeadPriorityBar';
import { VirtualGrid } from '@/components/VirtualGrid';
import { supabase } from '@/integrations/supabase/client';
import {
  useDealerLeads, useLeadAssignees, filterLeads, paginateLeads,
  leadTabCounts, leadPriorityCounts, leadListingTitles, leadSources, leadCountries,
  type DealerLead, type LeadStatus,
} from '@/hooks/useDealerLeads';
import { useDealerLeadsRealtime } from '@/hooks/useDealerLeadsRealtime';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { parseLeadsUrl, leadsUrlParams, type LeadsUrlState } from '@/lib/leadsUrl';

export default function Leads() {
  const { data: leads = [], isLoading } = useDealerLeads();
  const { data: assignees = [] } = useLeadAssignees();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  useDealerLeadsRealtime();
  useScrollRestoration();

  // URL is de bron van waarheid: tab, filters, sortering en scrollpositie
  // (paginanummer) zijn deelbaar en overleven een reload.
  const state = useMemo(() => parseLeadsUrl(searchParams), [searchParams]);
  const setState = useCallback((patch: Partial<LeadsUrlState>) => {
    setSearchParams(leadsUrlParams({ ...state, ...patch }), { replace: true });
  }, [state, setSearchParams]);

  const counts = useMemo(() => leadTabCounts(leads), [leads]);
  const priority = useMemo(() => leadPriorityCounts(leads), [leads]);
  const listings = useMemo(() => leadListingTitles(leads), [leads]);
  const sources = useMemo(() => leadSources(leads), [leads]);
  const countries = useMemo(() => leadCountries(leads), [leads]);

  const filtered = useMemo(() => filterLeads(leads, state), [leads, state]);
  const page = useMemo(() => paginateLeads(filtered, state.page), [filtered, state.page]);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['dealer-leads'] }),
    [queryClient],
  );

  const runRpc = useCallback(
    async (fn: string, args: Record<string, unknown>, okMessage: string) => {
      const { error } = await supabase.rpc(fn, args);
      if (error) {
        toast.error('Actie mislukt: ' + error.message);
        return false;
      }
      toast.success(okMessage);
      invalidate();
      return true;
    },
    [invalidate],
  );

  const handleStatusChange = useCallback(
    (lead: DealerLead, status: LeadStatus) => {
      if (lead.conversationId) {
        void runRpc('set_conversation_status', { _conversation_id: lead.conversationId, _status: status }, 'Status bijgewerkt');
      } else {
        void runRpc('set_dealer_lead_status', { _lead_id: lead.id, _status: status }, 'Status bijgewerkt');
      }
    },
    [runRpc],
  );

  const handleFollowUp = useCallback(
    (lead: DealerLead, iso: string | null) => {
      void runRpc(
        'set_lead_follow_up',
        { _lead_ref: lead.id, _follow_up_at: iso },
        iso ? 'Opvolging gepland' : 'Opvolging gewist',
      );
    },
    [runRpc],
  );

  const handleSnooze = useCallback(
    (lead: DealerLead, days: number | null) => {
      void runRpc(
        'snooze_lead',
        { _lead_ref: lead.id, _days: days },
        days ? `Lead gesnoozet voor ${days} ${days === 1 ? 'dag' : 'dagen'}` : 'Snooze opgeheven',
      );
    },
    [runRpc],
  );

  const handleAnswered = useCallback(
    (lead: DealerLead) => {
      if (!lead.isUnanswered) return;
      void runRpc('mark_lead_answered', { _lead_ref: lead.id }, 'Gemarkeerd als beantwoord');
    },
    [runRpc],
  );

  const handleAssign = useCallback(
    (lead: DealerLead, memberId: string | null) => {
      void runRpc(
        'assign_lead',
        { _lead_ref: lead.id, _member_id: memberId },
        memberId ? 'Lead toegewezen' : 'Toewijzing verwijderd',
      );
    },
    [runRpc],
  );

  const cardActions = useMemo(
    () => ({
      onStatusChange: handleStatusChange,
      onFollowUp: handleFollowUp,
      onSnooze: handleSnooze,
      onAnswered: handleAnswered,
      onAssign: handleAssign,
    }),
    [handleStatusChange, handleFollowUp, handleSnooze, handleAnswered, handleAssign],
  );

  const copyLink = useCallback(async () => {
    const params = leadsUrlParams(state);
    const url = `${window.location.origin}${window.location.pathname}${params.size ? `?${params}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link gekopieerd');
    } catch {
      toast.error('Kopiëren mislukt');
    }
  }, [state]);

  const EMPTY_LABELS: Record<string, string> = {
    action: 'Geen leads die actie nodig hebben.',
    in_progress: 'Geen leads in behandeling.',
    waiting_customer: 'Geen leads die op de klant wachten.',
    scheduled: 'Geen geplande opvolgingen.',
    done: 'Nog geen afgehandelde leads.',
    all: 'Nog geen leads ontvangen.',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">Je dagelijkse opvolgwerkplek voor kopers.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}>
          <Link2 className="h-4 w-4" /> Link kopiëren
        </Button>
      </div>

      <LeadPriorityBar
        counts={priority}
        active={state.focus}
        onSelect={(focus) => setState({ focus, page: 1 })}
      />

      <LeadFilters
        value={state}
        onChange={(v) => setState({ ...v, page: 1 })}
        counts={counts}
        listings={listings}
        assignees={assignees}
        sources={sources}
        countries={countries}
      />

      {/* Schermlezerstatus: aantal resultaten en laadtoestand */}
      <p className="sr-only" role="status" aria-live="polite">
        {isLoading
          ? 'Leads worden geladen…'
          : `${page.total} ${page.total === 1 ? 'lead' : 'leads'} gevonden.`}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Leads laden">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-24" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : page.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{EMPTY_LABELS[state.tab] ?? 'Geen leads gevonden.'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nieuwe aanvragen en berichten verschijnen hier automatisch.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <VirtualGrid
          items={page.visible}
          estimateHeight={230}
          minCardWidth={420}
          gap={16}
          getKey={(lead) => lead.id}
          hasMore={page.hasMore}
          onLoadMore={() => setState({ page: state.page + 1 })}
          footer={
            page.hasMore ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {page.visible.length} van {page.total} leads — scroll voor meer
              </p>
            ) : page.total > 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Alle {page.total} leads geladen
              </p>
            ) : null
          }
          renderItem={(lead) => (
            <LeadCard lead={lead} busy={false} assignees={assignees} actions={cardActions} />
          )}
        />
      )}
    </div>
  );
}
