import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MessageSquare, Building2, Car, ChevronDown, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { LEAD_STATUSES, type DealerLead, type LeadStatus } from '@/hooks/useDealerLeads';
import { cn } from '@/lib/utils';

const STATUS_META: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'Nieuw', className: 'bg-primary text-primary-foreground' },
  in_progress: { label: 'In behandeling', className: 'bg-accent text-accent-foreground' },
  done: { label: 'Afgehandeld', className: 'bg-success text-success-foreground' },
};

export function LeadCard({
  lead,
  onStatusChange,
  busy,
}: {
  lead: DealerLead;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[lead.status];
  const isConversation = lead.type === 'bericht';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{lead.name}</p>
              {lead.company && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Building2 className="h-3 w-3" /> {lead.company}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(lead.createdAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
              {lead.email ? ` · ${lead.email}` : ''}
              {lead.phone ? ` · ${lead.phone}` : ''}
            </p>
          </div>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="gap-1.5 shrink-0"
                aria-label={`Status wijzigen voor lead van ${lead.name}`}
              >
                <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', meta.className)}>{meta.label}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LEAD_STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(lead.id, s)}>
                  <span className={cn('mr-2 h-2 w-2 rounded-full', STATUS_META[s].className)} />
                  {STATUS_META[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {lead.listingTitle && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Car className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lead.listingTitle}</span>
          </p>
        )}

        {lead.snippet && (
          <p className="mt-2 text-sm text-foreground/90 line-clamp-2">{lead.snippet}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {isConversation && lead.conversationId ? (
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
  );
}
