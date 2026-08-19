import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Euro, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDealerAnalytics } from '@/hooks/useDealerAnalytics';

const formatPrice = (p: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(p);

type SortKey = 'views' | 'leads' | 'conversion' | 'age';

const SORTABLE: { key: SortKey; label: string }[] = [
  { key: 'views', label: 'Weergaven' },
  { key: 'leads', label: 'Leads' },
  { key: 'conversion', label: 'Conversie' },
  { key: 'age', label: 'Leeftijd' },
];

export default function Analytics() {
  const { listings, loading } = useDealerAnalytics();
  const [sort, setSort] = useState<SortKey>('views');

  const sortedListings = useMemo(() => {
    const leads = (l: (typeof listings)[number]) => l.favorites + l.conversations;
    const conv = (l: (typeof listings)[number]) => (l.views > 0 ? leads(l) / l.views : 0);
    const age = (l: (typeof listings)[number]) => Date.now() - new Date(l.createdAt).getTime();
    return [...listings].sort((a, b) => {
      if (sort === 'views') return b.views - a.views;
      if (sort === 'leads') return leads(b) - leads(a);
      if (sort === 'conversion') return conv(b) - conv(a);
      return age(b) - age(a);
    });
  }, [listings, sort]);


  const totalValue = useMemo(
    () => listings.filter((l) => l.status === 'active').reduce((s, l) => s + (l.price || 0), 0),
    [listings],
  );

  const avgAgeDays = useMemo(() => {
    const active = listings.filter((l) => l.status === 'active');
    if (active.length === 0) return 0;
    const now = Date.now();
    const sum = active.reduce((s, l) => s + (now - new Date(l.createdAt).getTime()) / 86400000, 0);
    return Math.round(sum / active.length);
  }, [listings]);

  const topPerformers = useMemo(
    () =>
      [...listings]
        .filter((l) => l.views > 0)
        .sort((a, b) => (b.favorites + b.conversations) / b.views - (a.favorites + a.conversations) / a.views)
        .slice(0, 5),
    [listings],
  );

  const slowMovers = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return listings
      .filter((l) => l.status === 'active' && new Date(l.createdAt).getTime() < cutoff && l.views < 20)
      .slice(0, 5);
  }, [listings]);

  const priceBuckets = useMemo(() => {
    const buckets = [
      { name: '< €10k', min: 0, max: 10000, views: 0, leads: 0 },
      { name: '€10–20k', min: 10000, max: 20000, views: 0, leads: 0 },
      { name: '€20–35k', min: 20000, max: 35000, views: 0, leads: 0 },
      { name: '€35–60k', min: 35000, max: 60000, views: 0, leads: 0 },
      { name: '> €60k', min: 60000, max: Infinity, views: 0, leads: 0 },
    ];
    listings.forEach((l) => {
      const b = buckets.find((b) => l.price >= b.min && l.price < b.max);
      if (b) { b.views += l.views; b.leads += l.favorites + l.conversations; }
    });
    return buckets;
  }, [listings]);

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Nog geen data om te tonen</p>
        <p className="text-sm mb-4">Voeg eerst voertuigen toe om analytics te zien.</p>
        <Button asChild><Link to="/zakelijk/voorraad">Naar voorraad</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <SEOHead title="Analytics — VATUUR. Zakelijk" description="Dealer-level analytics." noindex />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary-strong" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Inzicht in je voorraad en verkoopprestaties.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <Euro className="h-5 w-5 text-primary-strong" />
            <p className="text-2xl font-bold mt-2">{formatPrice(totalValue)}</p>
            <p className="text-xs text-muted-foreground">Voorraadwaarde (actief)</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <Clock className="h-5 w-5 text-chart-2" />
            <p className="text-2xl font-bold mt-2">{avgAgeDays} dagen</p>
            <p className="text-xs text-muted-foreground">Gem. tijd in voorraad</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <p className="text-2xl font-bold mt-2">{slowMovers.length}</p>
            <p className="text-xs text-muted-foreground">Slow-movers (&gt;30d, &lt;20 views)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Prijssegment-prestaties</CardTitle>
          <CardDescription>Totaal views en leads per prijsklasse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceBuckets} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                <Bar dataKey="leads" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-chart-3" /> Top-performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen views om te ranken.</p>
            ) : topPerformers.map((l, i) => {
              const rate = ((l.favorites + l.conversations) / l.views * 100).toFixed(1);
              return (
                <Link key={l.id} to={`/zakelijk/analytics/${l.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <img src={l.image || '/placeholder.svg'} alt="" className="h-8 w-12 rounded object-cover" />
                    <span className="text-sm truncate">{l.title}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary-strong">{rate}%</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" /> Slow-movers</CardTitle>
            <CardDescription>Actief &gt;30 dagen met &lt;20 views.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {slowMovers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen slow-movers. Goed bezig!</p>
            ) : slowMovers.map((l) => {
              const days = Math.round((Date.now() - new Date(l.createdAt).getTime()) / 86400000);
              return (
                <Link key={l.id} to={`/zakelijk/analytics/${l.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={l.image || '/placeholder.svg'} alt="" className="h-8 w-12 rounded object-cover" />
                    <span className="text-sm truncate">{l.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{days}d · {l.views} views</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Alle voertuigen</CardTitle>
          <CardDescription>Klik een wagen aan voor gedetailleerde statistieken.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Prestaties per voertuig, sorteerbaar</caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                <th scope="col" className="py-2 pr-2 font-medium">Voertuig</th>
                {SORTABLE.map((c) => (
                  <th key={c.key} scope="col" className="py-2 px-2 font-medium text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSort(c.key)}
                      className="focus-ring rounded px-1 hover:text-foreground"
                      aria-label={`Sorteer op ${c.label}`}
                    >
                      {c.label}{sort === c.key ? ' ↓' : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedListings.map((l) => (
                <tr key={l.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                  <td className="py-2 pr-2">
                    <Link to={`/zakelijk/analytics/${l.id}`} className="flex items-center gap-2 min-w-0 focus-ring rounded">
                      <img src={l.image || '/placeholder.svg'} alt="" loading="lazy" className="h-8 w-12 rounded object-cover bg-muted" />
                      <span className="truncate max-w-[16rem]">{l.title}</span>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{l.views}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{l.favorites + l.conversations}</td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {l.views > 0 ? `${(((l.favorites + l.conversations) / l.views) * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {Math.round((Date.now() - new Date(l.createdAt).getTime()) / 86400000)}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>

  );
}
