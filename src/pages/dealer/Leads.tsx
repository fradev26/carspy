import { useMemo, useState } from 'react';
import { Loader2, Inbox, Info } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useDealerLeads,
  filterLeads,
  leadListingTitles,
  type DealerLead,
  type LeadStatus,
  type LeadPeriod,
  type LeadSort,
} from '@/hooks/useDealerLeads';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadKpiRow } from '@/components/dealer/leads/LeadKpiRow';
import { LeadFilters, type LeadTab } from '@/components/dealer/leads/LeadFilters';
import { LeadCard } from '@/components/dealer/leads/LeadCard';
import { LeadEmptyState } from '@/components/dealer/leads/LeadEmptyState';
import { Can } from '@/components/auth/Can';

export default function Leads() {
  const { toast } = useToast();
  const perms = usePermissions();
  const { data: leads, isLoading, refetch } = useDealerLeads();
  const [tab, setTab] = useState<LeadTab>('all');
  const [query, setQuery] = useState('');
  const [listing, setListing] = useState('');
  const [period, setPeriod] = useState<LeadPeriod>('all');
  const [sort, setSort] = useState<LeadSort>('newest');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const visible = useMemo(
    () => filterLeads(all, { status: tab, query, listing, period, sort }),
    [all, tab, query, listing, period, sort],
  );

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
      </div>

      <Can do="canViewLeads" fallback={
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" /> Enkel de eigenaar, beheerder of verkoper van het bedrijf kan leads bekijken.
        </div>
      }>
        <LeadKpiRow leads={all} />

        <LeadFilters
          value={{ tab, query, listing, period, sort }}
          onChange={(v) => {
            setTab(v.tab);
            setQuery(v.query);
            setListing(v.listing);
            setPeriod(v.period);
            setSort(v.sort);
          }}
          counts={counts}
          listings={listingOptions}
        />

        {visible.length === 0 ? (
          <LeadEmptyState hasQuery={hasFilters} />

        ) : (
          <div className="space-y-3">
            {visible.map((lead: DealerLead) => (
              <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatus} busy={busyId === lead.id} />
            ))}
          </div>
        )}
      </Can>
    </div>
  );
}
