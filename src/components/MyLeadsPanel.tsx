import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Car, Sparkles, Megaphone, Users, CheckCircle2, Clock, Rocket, ArrowRight, FileText, Camera, Star, Eye, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMarketingEvents } from '@/hooks/useMarketingEvents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type LeadStatus = 'analyzed' | 'account_created' | 'listed' | 'offered_to_dealers' | 'sold';

interface LeadRow {
  id: string;
  brand: string;
  model: string | null;
  year: number | null;
  mileage: number | null;
  estimated_price: number | null;
  status: LeadStatus;
  created_at: string;
  offer_eligible_at: string | null;
  listing_id: string | null;
  listings?: {
    id: string;
    status: string;
    boost_until: string | null;
    created_at: string;
    views: number;
    images: string[] | null;
  } | null;
}

const STEPS: { key: LeadStatus; label: string; icon: typeof Sparkles }[] = [
  { key: 'analyzed', label: 'Geanalyseerd', icon: Sparkles },
  { key: 'account_created', label: 'Account', icon: CheckCircle2 },
  { key: 'listed', label: 'Online', icon: Megaphone },
  { key: 'offered_to_dealers', label: 'Bij dealers', icon: Users },
  { key: 'sold', label: 'Verkocht', icon: CheckCircle2 },
];

function statusBadge(lead: LeadRow) {
  const listing = lead.listings;
  if (lead.status === 'sold') return { label: 'Verkocht', variant: 'default' as const, icon: CheckCircle2, className: 'bg-success text-success-foreground' };
  if (lead.status === 'offered_to_dealers') return { label: 'Aangeboden aan dealers', variant: 'default' as const, icon: Users, className: 'bg-accent text-accent-foreground' };
  if (listing?.status === 'draft') return { label: 'Concept — nog niet online', variant: 'secondary' as const, icon: FileText, className: '' };
  if (listing && listing.boost_until && new Date(listing.boost_until) > new Date()) return { label: 'Boost actief', variant: 'default' as const, icon: Rocket, className: 'bg-primary text-primary-foreground' };
  if (listing?.status === 'active') return { label: 'Advertentie online', variant: 'default' as const, icon: Megaphone, className: 'bg-primary text-primary-foreground' };
  if (lead.status === 'account_created') return { label: 'Account aangemaakt', variant: 'secondary' as const, icon: CheckCircle2, className: '' };
  return { label: 'Geanalyseerd', variant: 'outline' as const, icon: Sparkles, className: '' };
}

function daysOnline(listing: LeadRow['listings']) {
  if (!listing) return null;
  const diff = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / 86400000);
  return diff;
}

function dealerEta(lead: LeadRow) {
  if (lead.status === 'offered_to_dealers' || lead.status === 'sold') return null;
  const listing = lead.listings;
  if (!listing || listing.status !== 'active') return null;
  const created = new Date(listing.created_at).getTime();
  const eligible = created + 14 * 86400000;
  const days = Math.ceil((eligible - Date.now()) / 86400000);
  if (days <= 0) return 'binnenkort';
  return `over ${days} dag${days === 1 ? '' : 'en'}`;
}

export default function MyLeadsPanel({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('vehicle_leads')
        .select('id, brand, model, year, mileage, estimated_price, status, created_at, offer_eligible_at, listing_id, listings:listing_id(id, status, boost_until, created_at, views, images)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(compact ? 3 : 20);
      if (!cancelled) {
        setLeads((data as unknown as LeadRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, compact]);

  if (!user) return null;
  if (loading) return (
    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  );
  if (leads.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> Mijn verkoopstatus</h3>
        {compact && <Link to="/dashboard" className="text-xs text-primary hover:underline">Alles bekijken →</Link>}
      </div>
      {leads.map(lead => {
        const badge = statusBadge(lead);
        const Icon = badge.icon;
        const currentStep =
          lead.status === 'sold' ? 4 :
          lead.status === 'offered_to_dealers' ? 3 :
          lead.listings?.status === 'active' || lead.listings?.status === 'draft' ? 2 :
          lead.status === 'account_created' ? 1 : 0;
        const days = daysOnline(lead.listings);
        const eta = dealerEta(lead);

        return (
          <Card key={lead.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{lead.brand} {lead.model ?? ''} {lead.year ? `· ${lead.year}` : ''}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lead.mileage ? `${lead.mileage.toLocaleString('nl-BE')} km` : null}
                    {lead.estimated_price ? ` · richtprijs € ${lead.estimated_price.toLocaleString('nl-BE')}` : null}
                  </p>
                </div>
                <Badge className={`gap-1 shrink-0 ${badge.className}`} variant={badge.variant}>
                  <Icon className="h-3 w-3" /> {badge.label}
                </Badge>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-1">
                {STEPS.slice(0, 5).map((s, i) => {
                  const active = i <= currentStep;
                  const StepIcon = s.icon;
                  return (
                    <div key={s.key} className="flex-1 flex items-center gap-1 min-w-0">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <StepIcon className="h-3 w-3" />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 rounded ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground -mt-1">
                {STEPS.map(s => <span key={s.key} className="truncate text-center">{s.label}</span>)}
              </div>

              {/* Context line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {days !== null && lead.listings?.status === 'active' && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {days} dag{days === 1 ? '' : 'en'} online</span>
                )}
                {lead.listings?.boost_until && new Date(lead.listings.boost_until) > new Date() && (
                  <span className="flex items-center gap-1 text-primary"><Rocket className="h-3 w-3" /> boost tot {new Date(lead.listings.boost_until).toLocaleDateString('nl-BE')}</span>
                )}
                {eta && (
                  <span>Beschikbaar voor dealers {eta}</span>
                )}
                {lead.status === 'offered_to_dealers' && lead.offer_eligible_at && (
                  <span>Sinds {new Date(lead.offer_eligible_at).toLocaleDateString('nl-BE')}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {lead.listings?.status === 'draft' && lead.listing_id && (
                  <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to={`/verkopen?draftId=${lead.listing_id}&step=2`}>Concept afwerken <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                )}
                {lead.listings?.status === 'active' && lead.listing_id && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link to={`/auto/${lead.listing_id}`}>Bekijk advertentie</Link>
                  </Button>
                )}
                {!lead.listing_id && (
                  <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to={`/verkopen?brand=${encodeURIComponent(lead.brand)}&model=${encodeURIComponent(lead.model ?? '')}&year=${lead.year ?? ''}&mileage=${lead.mileage ?? ''}&suggestedPrice=${lead.estimated_price ?? ''}`}>
                      <Megaphone className="h-3.5 w-3.5" /> Plaats advertentie
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
