import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Phone, Mail, MessageSquare, Building2, Car, ChevronDown, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LEAD_STATUSES, type LeadStatus } from '@/hooks/useDealerLeads';
import { useLeadDetail, updateLeadStatus } from '@/hooks/useLeadDetail';
import { STATUS_META } from '@/components/dealer/leads/LeadCard';
import { LeadTimeline } from '@/components/dealer/leads/LeadTimeline';
import { cn } from '@/lib/utils';

const TYPE_LABEL = { bericht: 'Bericht', contactaanvraag: 'Contactaanvraag' } as const;

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data, isLoading, refetch } = useLeadDetail(id);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(data ? `Lead: ${data.lead.name}` : 'Lead');

  const handleStatus = async (status: LeadStatus) => {
    if (!id) return;
    setBusy(true);
    const { error } = await updateLeadStatus(id, status);
    setBusy(false);
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

  if (!data) {
    return (
      <div className="container py-6 space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link to="/zakelijk/leads"><ArrowLeft className="h-4 w-4" /> Terug naar leads</Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Deze lead is niet gevonden of je hebt er geen toegang toe.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { lead, vehicle, events } = data;
  const meta = STATUS_META[lead.status];
  const isConversation = lead.type === 'bericht';

  return (
    <div className="container py-6 space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/zakelijk/leads"><ArrowLeft className="h-4 w-4" /> Terug naar leads</Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{lead.name}</h1>
          <Badge variant="secondary">{TYPE_LABEL[lead.type]}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              className="gap-1.5"
              aria-label={`Status wijzigen voor lead van ${lead.name}`}
            >
              <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', meta.className)}>{meta.label}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LEAD_STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatus(s)}>
                <span className={cn('mr-2 h-2 w-2 rounded-full', STATUS_META[s].className)} />
                {STATUS_META[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contactgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{lead.name}</p>
            {lead.company && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> {lead.company}
              </p>
            )}
            {lead.email ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${lead.email}`} className="hover:text-primary focus-ring rounded-sm">{lead.email}</a>
              </p>
            ) : null}
            {lead.phone ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${lead.phone}`} className="hover:text-primary focus-ring rounded-sm">{lead.phone}</a>
              </p>
            ) : null}
            {isConversation && !lead.email && !lead.phone && (
              <p className="text-muted-foreground">
                Contact loopt via berichten — contactgegevens worden niet gedeeld.
              </p>
            )}
            <div className="pt-2 flex flex-wrap gap-2">
              {isConversation ? (
                <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/berichten"><MessageSquare className="h-3.5 w-3.5" /> Antwoorden <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              ) : (
                <>
                  {lead.phone && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" /> Bellen</a>
                    </Button>
                  )}
                  {lead.email && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /> Mailen</a>
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voertuig</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle ? (
              <Link
                to={`/auto/${vehicle.id}`}
                className="flex items-center gap-3 rounded-lg border p-2.5 hover:border-primary/50 transition-colors focus-ring"
              >
                {vehicle.image ? (
                  <img
                    src={vehicle.image}
                    alt={vehicle.title}
                    className="h-16 w-24 rounded-md object-cover shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted shrink-0">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{vehicle.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-0.5">
                    € {vehicle.price.toLocaleString('nl-BE')}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Car className="h-4 w-4" /> Geen voertuig gekoppeld aan deze lead.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tijdlijn</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen activiteit voor deze lead.</p>
          ) : (
            <LeadTimeline events={events} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
