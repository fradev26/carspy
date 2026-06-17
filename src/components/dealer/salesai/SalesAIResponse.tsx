import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Flame,
  Zap,
  User,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Megaphone,
  Tag,
  BarChart3,
  Rocket,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type IconKey = 'flame' | 'zap' | 'user' | 'trending' | 'tag' | 'rocket' | 'chart' | 'megaphone' | 'check';

interface SalesBadge {
  label: string;
  tone?: Tone;
  icon?: IconKey;
}
interface SalesOpportunity {
  listing_id?: string | null;
  title: string;
  price?: number | null;
  margin?: number | null;
  badges?: SalesBadge[];
  reasons?: string[];
  risks?: string[];
}
interface SalesAction {
  label: string;
  type: 'write_ad' | 'market_compare' | 'optimize_price' | 'boost' | 'lead_campaign' | string;
  listing_id?: string | null;
}
interface SalesKpi {
  label: string;
  value: string;
  tone?: Tone;
}
export interface SalesAIPayload {
  summary?: string;
  opportunities?: SalesOpportunity[];
  actions?: SalesAction[];
  kpis?: SalesKpi[];
  risks?: string[];
}

const ICONS: Record<IconKey, LucideIcon> = {
  flame: Flame,
  zap: Zap,
  user: User,
  trending: TrendingUp,
  tag: Tag,
  rocket: Rocket,
  chart: BarChart3,
  megaphone: Megaphone,
  check: CheckCircle2,
};

function toneClasses(tone: Tone = 'neutral') {
  switch (tone) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'warning':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'danger':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'info':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function kpiAccent(tone: Tone = 'neutral') {
  switch (tone) {
    case 'success':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'warning':
      return 'text-amber-600 dark:text-amber-400';
    case 'danger':
      return 'text-destructive';
    case 'info':
      return 'text-primary';
    default:
      return 'text-foreground';
  }
}

const ACTION_ICON: Record<string, LucideIcon> = {
  write_ad: Megaphone,
  market_compare: BarChart3,
  optimize_price: Tag,
  boost: Rocket,
  lead_campaign: Sparkles,
};

function extractPayload(raw: string): { payload: SalesAIPayload | null; complete: boolean; hasFence: boolean } {
  const fenceStart = raw.indexOf('```vatuur-sales');
  if (fenceStart === -1) return { payload: null, complete: false, hasFence: false };
  const afterStart = raw.slice(fenceStart + '```vatuur-sales'.length);
  const fenceEnd = afterStart.indexOf('```');
  if (fenceEnd === -1) return { payload: null, complete: false, hasFence: true };
  const jsonStr = afterStart.slice(0, fenceEnd).trim();
  try {
    const data = JSON.parse(jsonStr) as SalesAIPayload;
    return { payload: data, complete: true, hasFence: true };
  } catch {
    return { payload: null, complete: false, hasFence: true };
  }
}

export function hasSalesAIPayload(content: string): boolean {
  return content.includes('```vatuur-sales');
}

function formatEuro(n?: number | null) {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  return `€${n.toLocaleString('nl-BE')}`;
}

interface Props {
  rawContent: string;
}

export function SalesAIResponse({ rawContent }: Props) {
  const navigate = useNavigate();
  const { payload, complete, hasFence } = useMemo(() => extractPayload(rawContent), [rawContent]);

  if (hasFence && !complete) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        SalesAI denkt na…
      </div>
    );
  }

  if (!payload) return null;

  const handleAction = (a: SalesAction) => {
    const id = a.listing_id;
    switch (a.type) {
      case 'write_ad':
        if (id) navigate(`/zakelijk/voorraad/${id}/advertentie`);
        break;
      case 'market_compare':
        if (id) navigate(`/zakelijk/voorraad/${id}?tab=markt`);
        break;
      case 'optimize_price':
        if (id) navigate(`/zakelijk/voorraad/${id}?tab=prijs`);
        break;
      case 'boost':
        if (id) navigate(`/zakelijk/voorraad/${id}?action=boost`);
        break;
      case 'lead_campaign':
        navigate('/zakelijk/leads');
        break;
    }
  };

  const { summary, opportunities = [], actions = [], kpis = [], risks = [] } = payload;

  return (
    <div className="not-prose space-y-4 w-full">
      {/* 1. AI Insight */}
      {summary && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">SalesAI Advies</p>
              <p className="text-sm font-medium leading-snug mt-0.5">{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Top kansen */}
      {opportunities.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Top kansen</h3>
          <div className="space-y-3">
            {opportunities.map((o, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate">{o.title}</CardTitle>
                      <div className="flex items-baseline gap-3 mt-1">
                        {formatEuro(o.price) && (
                          <span className="text-sm font-semibold text-primary">{formatEuro(o.price)}</span>
                        )}
                        {formatEuro(o.margin) && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            +{formatEuro(o.margin)} marge
                          </span>
                        )}
                      </div>
                    </div>
                    {o.listing_id && (
                      <Link
                        to={`/zakelijk/voorraad/${o.listing_id}`}
                        className="text-xs text-primary hover:underline shrink-0 inline-flex items-center gap-1"
                      >
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {o.badges && o.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {o.badges.map((b, bi) => {
                        const Icon = b.icon ? ICONS[b.icon] : undefined;
                        return (
                          <span
                            key={bi}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                              toneClasses(b.tone),
                            )}
                          >
                            {Icon && <Icon className="h-3 w-3" />}
                            {b.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {o.reasons && o.reasons.length > 0 && (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                        Waarom deze wagen?
                      </p>
                      <ul className="space-y-1">
                        {o.reasons.map((r, ri) => (
                          <li key={ri} className="flex items-start gap-1.5 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {o.risks && o.risks.length > 0 && (
                    <div className="space-y-1">
                      {o.risks.map((r, ri) => (
                        <div
                          key={ri}
                          className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. Acties */}
      {actions.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">SalesAI Acties</h3>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((a, i) => {
              const Icon = ACTION_ICON[a.type] || Sparkles;
              const disabled =
                !ACTION_ICON[a.type] ||
                (a.type !== 'lead_campaign' && !a.listing_id);
              return (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => handleAction(a)}
                  className="justify-start h-9"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="truncate">{a.label}</span>
                </Button>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Risico's (top-level) */}
      {risks.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Risico's</h3>
          <div className="space-y-1.5">
            {risks.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{r}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Verwacht resultaat */}
      {kpis.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Verwacht resultaat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {kpis.map((k, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-3">
                  <p className={cn('text-lg font-bold leading-tight', kpiAccent(k.tone))}>{k.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
