import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Zap,
  Flame,
  ArrowRight,
  Check,
  Sparkles,
  CalendarDays,
  Wallet,
  Package,
  Rocket,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

const formatEUR = (cents: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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

const PLAN_TAGLINES: Record<string, string> = {
  starter: 'Voor wie net begint en zonder vaste kost wil testen.',
  basic: 'Voor wie net begint en zonder vaste kost wil testen.',
  premium: 'Voor actieve dealers die continu willen verkopen.',
  pro: 'Voor grote voorraden die maximale zichtbaarheid vragen.',
  business: 'Voor grote voorraden die maximale zichtbaarheid vragen.',
};

const PLAN_BADGE: Record<string, string> = {
  premium: 'Meest gekozen',
  pro: 'Beste waarde',
  business: 'Beste waarde',
};

export default function Subscription() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [activeListings, setActiveListings] = useState(0);
  const [boostedListings, setBoostedListings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const plansRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const [
      { data: planRows },
      { data: bill },
      { data: usageRows },
      { data: sub },
      { count: active },
      { count: boosted },
    ] = await Promise.all([
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
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('boost_until', new Date().toISOString()),
    ]);
    if (planRows) setPlans(planRows as Plan[]);
    if (bill) setBilling(bill as unknown as Billing);
    if (usageRows) setUsage(usageRows as UsageRow[]);
    setCurrentPlanId(sub?.plan_id ?? null);
    setActiveListings(active ?? 0);
    setBoostedListings(boosted ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const switchPlan = async (planId: string) => {
    if (!user) return;
    if (!perms.canManageBilling) {
      toast.error('Alleen de eigenaar van het bedrijf kan het abonnement wijzigen');
      return;
    }
    setSwitching(planId);
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Create the new subscription first; only cancel the old one once that
    // succeeded, so a failure can never leave the dealer without a plan.
    const { data: created, error } = await supabase
      .from('dealer_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      })
      .select('id')
      .single();

    if (error || !created) {
      setSwitching(null);
      toast.error(`Wijziging mislukt: ${error?.message ?? 'onbekende fout'}`);
      return;
    }

    const { error: cancelError } = await supabase
      .from('dealer_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('id', created.id);
    setSwitching(null);
    if (cancelError) {
      toast.error(`Oud abonnement stopzetten mislukt: ${cancelError.message}`);
      load();
      return;
    }
    toast.success('Abonnement bijgewerkt');
    load();
  };

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId) ?? null,
    [plans, currentPlanId],
  );
  const recommendedPlan = useMemo(
    () => plans.find((p) => PLAN_BADGE[p.code] === 'Meest gekozen') ?? plans[Math.floor(plans.length / 2)],
    [plans],
  );

  // Group usage per maand voor "factuurgeschiedenis"
  const invoiceHistory = useMemo(() => {
    const map = new Map<string, { label: string; total: number; count: number; date: Date }>();
    usage.forEach((u) => {
      const d = new Date(u.starts_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key);
      const label = d.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
      if (existing) {
        existing.total += u.source === 'extra' ? u.price_cents : 0;
        existing.count += 1;
      } else {
        map.set(key, {
          label,
          total: u.source === 'extra' ? u.price_cents : 0,
          count: 1,
          date: d,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
  }, [usage]);

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const nextInvoiceDate = billing?.period_end ?? null;
  const hasActivePlan = !!currentPlan;

  return (
    <div className="container max-w-4xl py-6 md:py-10 space-y-8 pb-28">
      <SEOHead
        title="Abonnement — VATUUR. Zakelijk"
        description="Beheer je abonnement, boost-verbruik en facturatie."
        noindex
      />

      {/* Pagina-header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <CreditCard className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Zakelijk</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">Beheer je plan, boost-verbruik en facturatie.</p>
      </header>

      {/* Status hero */}
      <Card className="border-border/60 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
        <CardContent className="p-5 md:p-7">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={hasActivePlan ? 'default' : 'outline'}
                  className={cn(
                    'text-[10px] uppercase tracking-wider gap-1',
                    hasActivePlan && 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/10',
                  )}
                >
                  {hasActivePlan ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {hasActivePlan ? 'Actief' : 'Geen actief abonnement'}
                </Badge>
                {hasActivePlan && (
                  <span className="text-xs text-muted-foreground">Plan: <span className="font-medium text-foreground">{billing?.plan_name}</span></span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Huidige maandkost
                </p>
                <p className="text-4xl font-bold tabular-nums mt-1">
                  {formatEUR(billing?.total_cents ?? 0)}
                </p>
                {billing && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Basis {formatEUR(billing.base_cents)}
                    {billing.extra_cents > 0 && (
                      <>
                        {' + extra boosts '}
                        <span className="font-medium text-primary">{formatEUR(billing.extra_cents)}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Periode</p>
                  <p className="text-xs font-medium">
                    {formatDate(billing?.period_start)} → {formatDate(billing?.period_end)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Volgende factuur</p>
                  <p className="text-xs font-medium inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-primary" />
                    {formatDate(nextInvoiceDate)}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={scrollToPlans}
                  className="w-full md:w-auto min-h-11 font-semibold gap-2 focus-ring"
                  aria-label={hasActivePlan ? 'Beheer abonnement' : 'Activeer Premium abonnement'}
                >
                  {hasActivePlan ? 'Beheer abonnement' : 'Activeer Premium'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Boost-verbruik</p>
              <QuotaBar
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Turbo boosts"
                used={billing?.used_turbo ?? 0}
                total={billing?.included_turbo ?? 0}
              />
              <QuotaBar
                icon={<Flame className="h-3.5 w-3.5" />}
                label="Nitro boosts"
                used={billing?.used_nitro ?? 0}
                total={billing?.included_nitro ?? 0}
              />
              <p className="text-[11px] text-muted-foreground">
                Boosts activeer je via{' '}
                <Link to="/zakelijk/voorraad" className="underline hover:text-foreground">je voorraad</Link>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gebruiksstatistieken */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Jouw gebruik deze periode</h2>
          <p className="text-xs text-muted-foreground">Een snel overzicht van je voorraad en boosts.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile
            icon={<Zap className="h-4 w-4" />}
            label="Turbo gebruikt"
            value={`${billing?.used_turbo ?? 0}`}
            sub={`${Math.max(0, (billing?.included_turbo ?? 0) - (billing?.used_turbo ?? 0))} resterend`}
          />
          <StatTile
            icon={<Flame className="h-4 w-4" />}
            label="Nitro gebruikt"
            value={`${billing?.used_nitro ?? 0}`}
            sub={`${Math.max(0, (billing?.included_nitro ?? 0) - (billing?.used_nitro ?? 0))} resterend`}
          />
          <StatTile
            icon={<Package className="h-4 w-4" />}
            label="Actieve advertenties"
            value={`${activeListings}`}
            sub="Online in zoekresultaten"
          />
          <StatTile
            icon={<Rocket className="h-4 w-4" />}
            label="Nu geboosted"
            value={`${boostedListings}`}
            sub="Met actieve boost"
          />
        </div>
      </section>

      {/* Plannen */}
      <section ref={plansRef} className="space-y-3 scroll-mt-20">
        <div>
          <h2 className="text-base font-semibold">Kies je plan</h2>
          <p className="text-xs text-muted-foreground">Upgrade of wissel op elk moment — wijzigingen gaan direct in.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              current={p.id === currentPlanId}
              currentPlanPrice={currentPlan?.monthly_price_cents ?? 0}
              switching={switching === p.id}
              disabled={switching !== null}
              onSelect={() => switchPlan(p.id)}
            />
          ))}
        </div>
        {recommendedPlan && !hasActivePlan && (
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 px-1">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Geen verborgen kosten · maandelijks opzegbaar.
          </p>
        )}
      </section>

      {/* Facturatie */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Facturatie</h2>
          <p className="text-xs text-muted-foreground">Betaalmethode en factuurgeschiedenis.</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted/40 p-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Betaalmethode</p>
                  <p className="text-sm font-medium mt-0.5">Nog niet geconfigureerd</p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="mt-2 h-8 text-xs"
                    title="Binnenkort beschikbaar"
                  >
                    Beheer betaalmethode
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted/40 p-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Volgende incasso</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(nextInvoiceDate)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Geschat bedrag: <span className="font-medium text-foreground">{formatEUR(billing?.total_cents ?? 0)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" />
                  Factuurgeschiedenis
                </p>
                <Button variant="ghost" size="sm" disabled className="h-7 text-[11px]">
                  Alles beheren
                </Button>
              </div>
              {invoiceHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-md">
                  Nog geen facturen beschikbaar.
                </p>
              ) : (
                <ul className="divide-y divide-border/60 border border-border/60 rounded-md">
                  {invoiceHistory.map((inv, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">{inv.label}</p>
                        <p className="text-[11px] text-muted-foreground">{inv.count} boost{inv.count === 1 ? '' : 's'} geactiveerd</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatEUR((billing?.base_cents ?? 0) + inv.total)}</p>
                        <Button variant="ghost" size="sm" disabled className="h-6 text-[10px] px-1.5">
                          PDF binnenkort
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Veelgestelde vragen</h2>
          <p className="text-xs text-muted-foreground">Alles over abonnementen, boosts en facturatie.</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger className="text-sm">Hoe activeer ik een abonnement?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Kies een plan hierboven en klik op <span className="font-medium text-foreground">Activeer</span>. Je nieuwe plan is meteen actief en je inbegrepen boosts zijn direct beschikbaar.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger className="text-sm">Wat is het verschil tussen Turbo en Nitro?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Turbo</span> tilt je advertentie tijdelijk omhoog in de zoekresultaten. <span className="font-medium text-foreground">Nitro</span> doet hetzelfde maar voor een langere periode én met een opvallend label, zodat je nog meer bekeken wordt.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger className="text-sm">Kan ik op elk moment upgraden of downgraden?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Ja. Wijzigingen gaan onmiddellijk in. Bij een upgrade krijg je direct toegang tot extra boosts. Bij een downgrade geldt je nieuwe plan vanaf de volgende factuurperiode.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger className="text-sm">Wat gebeurt er met ongebruikte boosts?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Inbegrepen boosts vernieuwen elke factuurperiode en worden niet meegenomen naar de volgende maand. Activeer ze tijdig om er maximaal uit te halen.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger className="text-sm">Hoe zeg ik mijn abonnement op?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Je kan op elk moment opzeggen via deze pagina of via instellingen. Je behoudt toegang tot het einde van de huidige factuurperiode. Er zijn geen opzegkosten.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6">
                <AccordionTrigger className="text-sm">Wanneer wordt mijn factuur opgesteld?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Facturen worden aan het einde van elke factuurperiode opgesteld op basis van je basisplan + extra boosts. Geautomatiseerde incasso en PDF-facturen volgen binnenkort.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
  const remaining = Math.max(0, total - used);
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {used} / {total}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground">{remaining} resterend deze periode</p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PlanCard({
  plan,
  current,
  currentPlanPrice,
  switching,
  disabled,
  onSelect,
}: {
  plan: Plan;
  current: boolean;
  currentPlanPrice: number;
  switching: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const tagline = PLAN_TAGLINES[plan.code] ?? 'Volledige toegang tot het VATUUR. dealerplatform.';
  const badge = PLAN_BADGE[plan.code];
  const isUpgrade = currentPlanPrice > 0 && plan.monthly_price_cents > currentPlanPrice;
  const ctaLabel = current
    ? 'Huidig plan'
    : switching
      ? 'Bezig…'
      : currentPlanPrice === 0
        ? `Activeer ${plan.name}`
        : isUpgrade
          ? `Upgrade naar ${plan.name}`
          : `Kies ${plan.name}`;

  return (
    <Card
      className={cn(
        'relative border-border/60 transition-all flex flex-col',
        current && 'border-primary/60 ring-2 ring-primary/30 shadow-lg',
        !current && badge && 'border-primary/30 shadow-md',
      )}
    >
      {badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className="text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            {badge}
          </Badge>
        </div>
      )}
      <CardContent className="p-5 flex flex-col gap-3 flex-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-base">{plan.name}</p>
            {current && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary gap-1">
                <Check className="h-3 w-3" /> Actief
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug min-h-[28px]">{tagline}</p>
        </div>
        <div>
          <p className="text-3xl font-bold tabular-nums">
            {formatEUR(plan.monthly_price_cents)}
            <span className="text-xs font-normal text-muted-foreground"> /maand</span>
          </p>
        </div>
        <ul className="text-xs space-y-2 flex-1">
          <PlanBenefit icon={<Zap className="h-3.5 w-3.5" />}>
            <span className="font-medium text-foreground">{plan.included_turbo}</span> Turbo boosts /maand inbegrepen
          </PlanBenefit>
          <PlanBenefit icon={<Flame className="h-3.5 w-3.5" />}>
            <span className="font-medium text-foreground">{plan.included_nitro}</span> Nitro boosts /maand inbegrepen
          </PlanBenefit>
          <PlanBenefit icon={<Sparkles className="h-3.5 w-3.5" />}>
            Prioriteit in de VATUUR. zoekresultaten
          </PlanBenefit>
          <PlanBenefit icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            AI-prijsanalyse op je volledige voorraad
          </PlanBenefit>
        </ul>
        <Button
          onClick={onSelect}
          disabled={current || disabled}
          variant={current ? 'outline' : 'default'}
          size="lg"
          className={cn(
            'w-full min-h-11 gap-1.5 font-semibold focus-ring mt-1',
            !current && badge === 'Meest gekozen' && 'shadow-md',
          )}
          aria-label={ctaLabel}
        >
          {ctaLabel}
          {!current && !switching && <ArrowRight className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}

function PlanBenefit({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground">
      <span className="mt-0.5 text-primary shrink-0">{icon}</span>
      <span className="leading-snug">{children}</span>
    </li>
  );
}
