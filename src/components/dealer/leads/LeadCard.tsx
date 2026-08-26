import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MessageSquare, ChevronDown, ArrowRight, CalendarClock,
  AlarmClock, MoreHorizontal, UserPlus, Info, AlertTriangle, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LEAD_STATUSES, followUpState, isLeadSnoozed, waitingDays,
  type DealerLead, type LeadAssignee, type LeadStatus,
} from '@/hooks/useDealerLeads';
import { cn } from '@/lib/utils';

/** Rustige, toegankelijke statusbadges: gekleurde stip + neutrale tekst. */
export const STATUS_META: Record<LeadStatus, { label: string; dot: string }> = {
  new: { label: 'Nieuw', dot: 'bg-primary' },
  in_progress: { label: 'In behandeling', dot: 'bg-status-diagnosing' },
  waiting_customer: { label: 'Wachten op klant', dot: 'bg-status-delivered' },
  scheduled: { label: 'Gepland', dot: 'bg-status-waiting-parts' },
  done: { label: 'Afgehandeld', dot: 'bg-success' },
};

const SOURCE_LABELS: Record<string, string> = {
  bericht: 'Bericht',
  contact_form: 'Contactformulier',
  'mock-seed': 'Import',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return minutes <= 1 ? 'zojuist' : `${minutes} min geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} u geleden`;
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Compacte, ingetogen rij voor systeemactiviteiten (geen echte lead). */
function SystemActivityRow({ lead }: { lead: DealerLead }) {
  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="flex items-center gap-3 px-4 py-2.5">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          <span className="font-medium">{lead.name}</span>
          {lead.listingTitle ? ` · ${lead.listingTitle}` : ''} — {lead.snippet}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(lead.lastActivityAt)}</span>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to={`/zakelijk/leads/${lead.id}`}>Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export interface LeadCardActions {
  onStatusChange: (lead: DealerLead, status: LeadStatus) => void;
  onFollowUp: (lead: DealerLead, iso: string | null) => void;
  onSnooze: (lead: DealerLead, days: number | null) => void;
  onAnswered: (lead: DealerLead) => void;
  onAssign: (lead: DealerLead, memberId: string | null) => void;
}

export function LeadCard({
  lead,
  busy,
  assignees,
  actions,
}: {
  lead: DealerLead;
  busy: boolean;
  assignees: LeadAssignee[];
  actions: LeadCardActions;
}) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');

  if (lead.isSystemActivity) return <SystemActivityRow lead={lead} />;

  const meta = STATUS_META[lead.status];
  const isConversation = lead.type === 'bericht';
  const fu = followUpState(lead);
  const snoozed = isLeadSnoozed(lead);
  const waitDays = waitingDays(lead);

  const answer = () => actions.onAnswered(lead);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar met initialen */}
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary-strong"
          >
            {initials(lead.name)}
          </div>

          <div className="min-w-0 flex-1">
            {/* Naam + bedrijf | status + tijd */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/zakelijk/leads/${lead.id}`}
                  className="font-semibold truncate hover:text-primary focus-ring rounded-sm"
                >
                  {lead.name}
                </Link>
                {lead.company && (
                  <span className="ml-2 text-xs text-muted-foreground truncate">{lead.company}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {relativeTime(lead.lastActivityAt)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="h-7 gap-1.5 px-2 text-xs"
                      aria-label={`Status wijzigen voor lead van ${lead.name}`}
                    >
                      <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                      {meta.label}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {LEAD_STATUSES.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => actions.onStatusChange(lead, s)}>
                        <span className={cn('mr-2 h-2 w-2 rounded-full', STATUS_META[s].dot)} />
                        {STATUS_META[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Voertuig als prominente titel */}
            {lead.listingTitle && (
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {lead.listingId ? (
                  <Link to={`/auto/${lead.listingId}`} className="hover:text-primary focus-ring rounded-sm">
                    {lead.listingTitle}
                  </Link>
                ) : (
                  lead.listingTitle
                )}
              </p>
            )}

            {/* Bericht */}
            {lead.snippet && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{lead.snippet}</p>
            )}

            {/* Metadata-chips: bron, land, urgentie, toewijzing, snooze */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {SOURCE_LABELS[lead.source] ?? lead.source}
              </span>
              {lead.country && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{lead.country}</span>
              )}
              {fu === 'overdue' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 font-medium text-foreground">
                  <AlertTriangle className="h-3 w-3 text-warning" /> Opvolging te laat
                </span>
              )}
              {fu === 'today' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 font-medium text-foreground">
                  <CalendarClock className="h-3 w-3 text-warning" /> Opvolging vandaag
                </span>
              )}
              {lead.isUnanswered && waitDays >= 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 font-medium text-foreground">
                  <Clock className="h-3 w-3 text-warning" /> Wacht {waitDays} {waitDays === 1 ? 'dag' : 'dagen'}
                </span>
              )}
              {snoozed && lead.snoozedUntil && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  <AlarmClock className="h-3 w-3" /> Gesnoozet tot{' '}
                  {new Date(lead.snoozedUntil).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {lead.assignedName && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {lead.assignedName}
                </span>
              )}
            </div>

            {/* Consistente snelle acties op élke lead */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {isConversation && lead.conversationId ? (
                <Button asChild size="sm" className="gap-1.5">
                  <Link to="/berichten">
                    <MessageSquare className="h-3.5 w-3.5" /> Beantwoorden <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : lead.email ? (
                <Button asChild size="sm" className="gap-1.5" onClick={answer}>
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-3.5 w-3.5" /> Beantwoorden
                  </a>
                </Button>
              ) : lead.phone ? (
                <Button asChild size="sm" className="gap-1.5" onClick={answer}>
                  <a href={`tel:${lead.phone}`}>
                    <Phone className="h-3.5 w-3.5" /> Beantwoorden
                  </a>
                </Button>
              ) : (
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/zakelijk/leads/${lead.id}`}>
                    <MessageSquare className="h-3.5 w-3.5" /> Beantwoorden
                  </Link>
                </Button>
              )}

              {lead.phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild size="icon" variant="outline" className="h-9 w-9" onClick={answer}>
                      <a href={`tel:${lead.phone}`} aria-label={`Bel ${lead.name} (${lead.phone})`} title={lead.phone}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{lead.phone}</TooltipContent>
                </Tooltip>
              )}
              {lead.email && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild size="icon" variant="outline" className="h-9 w-9" onClick={answer}>
                      <a href={`mailto:${lead.email}`} aria-label={`Mail ${lead.name} (${lead.email})`} title={lead.email}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{lead.email}</TooltipContent>
                </Tooltip>
              )}

              {/* Opvolging inplannen */}
              <Popover open={followUpOpen} onOpenChange={setFollowUpOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn('h-9 w-9', fu && 'border-warning/50')}
                    aria-label={`Opvolging inplannen voor ${lead.name}`}
                  >
                    <CalendarClock className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 space-y-2">
                  <p className="text-sm font-medium">Opvolging inplannen</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { actions.onFollowUp(lead, addDaysIso(0)); setFollowUpOpen(false); }}
                    >
                      Vandaag
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { actions.onFollowUp(lead, addDaysIso(1)); setFollowUpOpen(false); }}
                    >
                      Morgen
                    </Button>
                  </div>
                  <Input
                    type="date"
                    aria-label="Kies een opvolgdatum"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!customDate}
                      onClick={() => {
                        actions.onFollowUp(lead, new Date(`${customDate}T09:00:00`).toISOString());
                        setFollowUpOpen(false);
                      }}
                    >
                      Plan
                    </Button>
                    {lead.followUpAt && (
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { actions.onFollowUp(lead, null); setFollowUpOpen(false); }}
                      >
                        Wissen
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Meer: snoozen + toewijzen */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon" variant="ghost" className="h-9 w-9"
                    aria-label={`Meer acties voor lead van ${lead.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => actions.onSnooze(lead, 1)}>
                    <AlarmClock className="mr-2 h-4 w-4" /> Snooze 1 dag
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onSnooze(lead, 3)}>
                    <AlarmClock className="mr-2 h-4 w-4" /> Snooze 3 dagen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onSnooze(lead, 7)}>
                    <AlarmClock className="mr-2 h-4 w-4" /> Snooze 1 week
                  </DropdownMenuItem>
                  {snoozed && (
                    <DropdownMenuItem onClick={() => actions.onSnooze(lead, null)}>
                      <AlarmClock className="mr-2 h-4 w-4" /> Snooze opheffen
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <UserPlus className="mr-2 h-4 w-4" /> Toewijzen aan
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {assignees.map((a) => (
                        <DropdownMenuItem key={a.id} onClick={() => actions.onAssign(lead, a.id)}>
                          {a.name}
                          {lead.assignedTo === a.id && <span className="ml-2 text-primary">•</span>}
                        </DropdownMenuItem>
                      ))}
                      {lead.assignedTo && (
                        <DropdownMenuItem onClick={() => actions.onAssign(lead, null)}>
                          Niet toegewezen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
