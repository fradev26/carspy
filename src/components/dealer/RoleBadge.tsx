import { Crown, Shield, Tag, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompanyRole } from '@/hooks/usePermissions';

const META: Record<CompanyRole, { label: string; icon: typeof Crown; cls: string }> = {
  owner:     { label: 'Eigenaar', icon: Crown,     cls: 'bg-primary/10 text-primary border-primary/30' },
  manager:   { label: 'Manager',  icon: Shield,    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  seller:    { label: 'Verkoper', icon: Tag,       cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  marketing: { label: 'Marketing',icon: Megaphone, cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' },
};

export function RoleBadge({ role, className }: { role: CompanyRole; className?: string }) {
  const m = META[role];
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', m.cls, className)}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

export const ROLE_DESCRIPTIONS: Record<CompanyRole, string> = {
  owner: 'Volledige toegang: abonnement, gebruikers, advertenties en bedrijfsinstellingen.',
  manager: 'Beheert voorraad, boosts, leads en statistieken. Geen abonnement of gebruikers.',
  seller: 'Maakt en bewerkt advertenties, beantwoordt leads en uploadt foto\u2019s.',
  marketing: 'Bewerkt advertenties, start boosts en bekijkt statistieken.',
};
