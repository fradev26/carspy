import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Zap, Flame, ArrowRight, Check } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatEUR = (cents: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price_cents: number;
  included_turbo: number;
  included_nitro: number;
  sort_order: number;
};

type Billing = {
  plan_code: string | null;
  plan_name: string | null;
  base_cents: number;
  extra_cents: number;
  total_cents: number;
  included_turbo: number;
  included_nitro: number;
  used_turbo: number;
  used_nitro: number;
  period_start: string;
  period_end: string;
};

type UsageRow = {
  id: string;
  listing_id: string;
  package_code: string;
  source: string;
  price_cents: number;
  starts_at: string;
  ends_at: string;
};

export default function Subscription() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: planRows }, { data: bill }, { data: usageRows }, { data: sub }] =
      await Promise.all([
        supabase.from('subscription_plans').select('*').order('sort_order'),
        supabase.rpc('get_current_billing', { _user_id: user.id }),
        supabase
          .from('boost_usage')
          .select('id, listing_id, package_code, source, price_cents, starts_at, ends_at')
          .eq('user_id', user.id)
          .order('starts_at', { ascending: false })
          .limit(30),
        supabase
          .from('dealer_subscriptions')
          .select('plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
      ]);
    if (planRows) setPlans(planRows as Plan[]);
    if (bill) setBilling(bill as unknown as Billing);
    if (usageRows) setUsage(usageRows as UsageRow[]);
    if (sub?.plan_id) setCurrentPlanId(sub.plan_id);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const switchPlan = async (planId: string) => {
    if (!user) return;
    setSwitching(planId);
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Deactivate old
    await supabase
      .from('dealer_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { error } = await supabase.from('dealer_subscriptions').insert({
      user_id: user.id,
      plan_id: planId,
      status: 'active',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });
    setSwitching(null);
    if (error) {
      toast.error(`Wijziging mislukt: ${error.message}`);
      return;
    }
    toast.success('Abonnement bijgewerkt');
    load();
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6 space-y-6 pb-24">
      <SEOHead title="Abonnement — VATUUR. Zakelijk" description="Beheer je abonnement en boost-verbruik." noindex />

      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Abonnement</h1>
      </div>

      {/* Maandkost-kaart */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Huidige maandkost
              </p>
              <p className="text-3xl font-bold mt-1">{formatEUR(billing?.total_cents ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {billing?.plan_name ? (
                  <>
                    Plan: <span className="font-medium text-foreground">{billing.plan_name}</span>
                    {' · '}basis {formatEUR(billing.base_cents)}
                    {billing.extra_cents > 0 && (
                      <>
                        {' '}+ extra boosts <span className="font-medium text-primary">{formatEUR(billing.extra_cents)}</span>
                      </>
                    )}
                  </>
                ) : (
                  'Geen actief abonnement'
                )}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Periode tot {new Date(billing?.period_end ?? Date.now()).toLocaleDateString('nl-BE')}
            </Badge>
          </div>

          {billing && (
            <div className="grid grid-cols-2 gap-3">
              <QuotaBar
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Turbo boosts"
                used={billing.used_turbo}
                total={billing.included_turbo}
              />
              <QuotaBar
                icon={<Flame className="h-3.5 w-3.5" />}
                label="Nitro boosts"
                used={billing.used_nitro}
                total={billing.included_nitro}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Boosts activeer je via{' '}
            <Link to="/zakelijk/voorraad" className="underline hover:text-foreground">
              je voorraad
            </Link>{' '}
            of via{' '}
            <Link to="/zakelijk/instellingen" className="underline hover:text-foreground">
              Instellingen → Boosten
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {/* Plannen */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary/80 px-1 mb-2">
          Plannen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((p) => {
            const current = p.id === currentPlanId;
            return (
              <Card
                key={p.id}
                className={cn(
                  'border-border/60 transition-all',
                  current && 'border-primary ring-2 ring-primary/30',
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatEUR(p.monthly_price_cents)}
                        <span className="text-xs font-normal text-muted-foreground"> /maand</span>
                      </p>
                    </div>
                    {current && (
                      <Badge className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Actief
                      </Badge>
                    )}
                  </div>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-primary" /> {p.included_turbo} Turbo boosts /maand
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-primary" /> {p.included_nitro} Nitro boosts /maand
                    </li>
                  </ul>
                  <Button
                    onClick={() => switchPlan(p.id)}
                    disabled={current || switching !== null}
                    variant={current ? 'outline' : 'default'}
                    size="sm"
                    className="w-full gap-1.5"
                  >
                    {current ? 'Huidig plan' : switching === p.id ? 'Bezig…' : (
                      <>
                        Kiezen <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Verbruik deze periode */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary/80 px-1 mb-2">
          Boost-verbruik
        </h2>
        <Card className="border-border/60">
          <CardContent className="p-0">
            {usage.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">
                Nog geen boosts geactiveerd.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {usage.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.package_code === 'turbo' ? (
                        <Zap className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Flame className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">{u.package_code} boost</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(u.starts_at).toLocaleDateString('nl-BE')} →{' '}
                          {new Date(u.ends_at).toLocaleDateString('nl-BE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {u.source === 'extra' ? (
                        <span className="text-sm font-semibold text-primary">
                          +{formatEUR(u.price_cents)}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Inbegrepen</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuotaBar({
  icon,
  label,
  used,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        <span className="text-muted-foreground">
          {used} / {total}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}
