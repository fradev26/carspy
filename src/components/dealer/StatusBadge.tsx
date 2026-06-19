import { cn } from '@/lib/utils';

type Status = 'active' | 'invited' | 'blocked';

const META: Record<Status, { label: string; cls: string; dot: string }> = {
  active:  { label: 'Actief',      cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  invited: { label: 'Uitgenodigd', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',       dot: 'bg-amber-500' },
  blocked: { label: 'Geblokkeerd', cls: 'bg-muted text-muted-foreground',                            dot: 'bg-muted-foreground' },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', m.cls, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} /> {m.label}
    </span>
  );
}
