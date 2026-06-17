import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ListingStatusValue = 'active' | 'reserved' | 'sold' | 'draft' | 'inactive' | 'expired' | string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:    { label: 'Beschikbaar',  className: 'bg-success text-success-foreground' },
  reserved:  { label: 'Gereserveerd', className: 'bg-warning text-warning-foreground' },
  sold:      { label: 'Verkocht',     className: 'bg-destructive text-destructive-foreground' },
  draft:     { label: 'Concept',      className: 'bg-muted text-muted-foreground border border-border' },
  inactive:  { label: 'Gepauzeerd',   className: 'bg-muted text-muted-foreground border border-border' },
  expired:   { label: 'Verlopen',     className: 'bg-muted text-muted-foreground border border-border' },
};

interface StatusBadgeProps {
  status: ListingStatusValue;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge className={cn('font-medium shadow-sm backdrop-blur-sm', cfg.className, className)}>
      {cfg.label}
    </Badge>
  );
}
