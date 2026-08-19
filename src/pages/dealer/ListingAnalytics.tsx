import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Heart, MessageSquare, Users, TrendingUp, TrendingDown,
  Rocket, Pencil, BarChart3, ExternalLink,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/modules/listings/StatusBadge';
import { BoostDialog } from '@/components/boost/BoostDialog';
import {
  useListingAnalytics, benchmarkDelta, type AnalyticsPeriod,
} from '@/hooks/useListingAnalytics';

const PERIODS: AnalyticsPeriod[] = [7, 30, 90];

const formatPrice = (p: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(p);

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });

export default function ListingAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const [boostOpen, setBoostOpen] = useState(false);
  const { data, loading, error, refresh } = useListingAnalytics(id, days);

  if (loading && !data) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{error ?? 'Geen statistieken beschikbaar'}</p>
        <Button asChild className="mt-4"><Link to="/zakelijk/analytics">Terug naar analytics</Link></Button>
      </div>
    );
  }

  const { listing, totals, period, series, benchmark } = data;
  const conversion = totals.views > 0
    ? ((totals.favorites + totals.conversations) / totals.views) * 100
    : null;
  const delta = benchmarkDelta(benchmark.ownViewsPerDay, benchmark.peerAvgViewsPerDay);
  const hasData = series.some((p) => p.views + p.leads + p.messages > 0);

  const kpis = [
    { label: 'Weergaven', value: totals.views, icon: Eye, sub: `${period.views} in ${days} dagen` },
    { label: 'Favorieten', value: totals.favorites, icon: Heart, sub: `${period.favorites} in ${days} dagen` },
    { label: 'Gesprekken', value: totals.conversations, icon: Users, sub: `${period.conversations} in ${days} dagen` },
    { label: 'Berichten', value: totals.messages, icon: MessageSquare, sub: `${period.messages} in ${days} dagen` },
  ];

  const funnel = [
    { label: 'Weergaven', value: totals.views },
    { label: 'Favorieten', value: totals.favorites },
    { label: 'Gesprekken', value: totals.conversations },
    { label: 'Berichten', value: totals.messages },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <div className="container py-6 space-y-6">
      <SEOHead title={`Statistieken ${listing.title} — VATUUR. Zakelijk`} description="Statistieken per voertuig." noindex />

      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/zakelijk/analytics"><ArrowLeft className="h-4 w-4 mr-1" /> Analytics</Link>
      </Button>

      <Card className="border-border/60">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <img
            src={listing.image || '/placeholder.svg'}
            alt=""
            loading="lazy"
            className="h-20 w-32 rounded-lg object-cover bg-muted"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={listing.status} />
              <span className="text-sm font-semibold">{formatPrice(listing.price)}</span>
              <Badge variant="secondary">{listing.daysLive} dagen online</Badge>
              {listing.boostUntil && new Date(listing.boostUntil) > new Date() && (
                <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/30">Geboost</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setBoostOpen(true)}>
              <Rocket className="h-4 w-4 mr-1.5" /> Boosten
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/zakelijk/voorraad/${listing.id}`}><Pencil className="h-4 w-4 mr-1.5" /> Beheren</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to={`/auto/${listing.id}`}><ExternalLink className="h-4 w-4 mr-1.5" /> Bekijken</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60">
            <CardContent className="p-4">
              <k.icon className="h-4 w-4 text-primary-strong" />
              <p className="text-2xl font-bold mt-2">{k.value}</p>
              <p className="text-xs font-medium">{k.label}</p>
              <p className="text-[11px] text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Verloop</CardTitle>
            <CardDescription>Weergaven en leads per dag.</CardDescription>
          </div>
          <div className="flex gap-1" role="group" aria-label="Periode kiezen">
            {PERIODS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === days ? 'default' : 'outline'}
                onClick={() => setDays(p)}
                aria-pressed={p === days}
              >
                {p}d
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => formatDay(String(v))}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="views" name="Weergaven" stroke="hsl(var(--primary))" fill="url(#viewsFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--chart-2))" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Nog geen meetdata voor deze periode. Weergaven worden geteld vanaf het moment dat bezoekers
              de advertentie openen.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Trechter</CardTitle>
            <CardDescription>Van weergave tot gesprek.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((f, i) => {
              const prev = i === 0 ? null : funnel[i - 1].value;
              const rate = prev && prev > 0 ? ((f.value / prev) * 100).toFixed(0) : null;
              return (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{f.label}</span>
                    <span className="font-semibold">
                      {f.value}
                      {rate !== null && <span className="text-muted-foreground font-normal"> · {rate}%</span>}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.max((f.value / funnelMax) * 100, f.value > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-1">
              Conversie: {conversion === null ? 'nog geen weergaven' : `${conversion.toFixed(1)}% van de weergaven leidt tot een lead`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Vergelijking met je voorraad</CardTitle>
            <CardDescription>Wagens in hetzelfde prijssegment (±25%).</CardDescription>
          </CardHeader>
          <CardContent>
            {benchmark.peerCount === 0 || delta === null ? (
              <p className="text-sm text-muted-foreground">
                Nog te weinig vergelijkbare wagens of meetdata om een betrouwbare vergelijking te maken.
              </p>
            ) : (
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-lg font-bold ${delta >= 0 ? 'text-chart-3' : 'text-destructive'}`}>
                  {delta >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {delta >= 0 ? '+' : ''}{delta}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Deze wagen krijgt {Math.abs(delta)}% {delta >= 0 ? 'meer' : 'minder'} weergaven per dag dan de{' '}
                  {benchmark.peerCount} vergelijkbare {benchmark.peerCount === 1 ? 'wagen' : 'wagens'} in je voorraad
                  ({benchmark.ownViewsPerDay.toFixed(1)} vs. {(benchmark.peerAvgViewsPerDay ?? 0).toFixed(1)} per dag).
                </p>
                {delta < -20 && (
                  <p className="text-sm">
                    Tip: een boost of scherpere prijs helpt vaak om zichtbaarheid terug te winnen.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BoostDialog
        open={boostOpen}
        onOpenChange={setBoostOpen}
        listingId={listing.id}
        listingTitle={listing.title}
        lockedListing
        onSuccess={refresh}
      />
    </div>
  );
}
