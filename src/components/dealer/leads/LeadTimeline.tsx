import { Flag, MessageSquare, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMELINE_STATUS_LABELS, type LeadTimelineEvent } from '@/hooks/useLeadDetail';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const KIND_ICON = {
  created: Flag,
  status: RefreshCw,
  message: MessageSquare,
} as const;

/** Chronologische timeline van statuswijzigingen en berichten (nieuwste eerst). */
export function LeadTimeline({ events }: { events: LeadTimelineEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6" aria-label="Tijdlijn van de lead">
      {events.map((event) => {
        const Icon = KIND_ICON[event.kind];
        return (
          <li key={event.id} className="relative">
            <span
              className={cn(
                'absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-background',
                event.kind === 'status' && 'text-primary',
                event.kind === 'message' && 'text-muted-foreground',
                event.kind === 'created' && 'text-success',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-xs text-muted-foreground">{formatTime(event.at)}</p>
            {event.kind === 'status' && (
              <p className="mt-0.5 text-sm">
                Status gewijzigd
                {event.fromStatus && event.toStatus && (
                  <>
                    : <span className="font-medium">{TIMELINE_STATUS_LABELS[event.fromStatus] ?? event.fromStatus}</span>
                    {' → '}
                    <span className="font-medium">{TIMELINE_STATUS_LABELS[event.toStatus] ?? event.toStatus}</span>
                  </>
                )}
              </p>
            )}
            {event.kind === 'created' && <p className="mt-0.5 text-sm font-medium">{event.content}</p>}
            {event.kind === 'message' && (
              <div className="mt-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {event.senderIsDealer ? `${event.senderName} (jij)` : event.senderName}
                </p>
                <p className="mt-0.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">{event.content}</p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
