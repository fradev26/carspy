import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Heart, MessageCircle, TrendingUp, Brain, CheckCircle2,
  ExternalLink, Pencil, BarChart3, Globe2, Sparkles
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  views: number;
  images: string[] | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  power: number | null;
  created_at: string;
}

const formatPrice = (p: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(p);

export default function ListingOperating() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(0);
  const [messages, setMessages] = useState(0);
  const [trend, setTrend] = useState<{ date: string; views: number; favorites: number; messages: number }[]>([]);
  const [autoScout, setAutoScout] = useState<{ status: string; last_sync_at: string | null } | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // edit form
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('listings')
        .select('id,title,description,price,status,views,images,brand,model,year,mileage,fuel_type,transmission,power,created_at')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        setListing(data as any);
        setEditPrice(String(data.price ?? ''));
        setEditDesc(data.description ?? '');
        setEditStatus(data.status ?? 'active');
      }

      const [{ count: favCount }, { count: msgCount }, eventsRes, autoRes] = await Promise.all([
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('listing_id', id),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('listing_id' as any, id),
        supabase
          .from('marketing_events')
          .select('event_type, created_at')
          .eq('listing_id' as any, id)
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase
          .from('autoscout_listings')
          .select('status, last_sync_at')
          .eq('listing_id', id)
          .maybeSingle(),
      ]);

      setFavorites(favCount ?? 0);
      setMessages(msgCount ?? 0);
      if (autoRes.data) setAutoScout(autoRes.data as any);

      const byDay = new Map<string, { views: number; favorites: number; messages: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        byDay.set(d, { views: 0, favorites: 0, messages: 0 });
      }
      (eventsRes.data ?? []).forEach((e: any) => {
        const d = e.created_at.slice(0, 10);
        const b = byDay.get(d);
        if (!b) return;
        if (e.event_type === 'view' || e.event_type === 'listing_view') b.views++;
        else if (e.event_type === 'favorite' || e.event_type === 'listing_favorite') b.favorites++;
        else if (e.event_type === 'message' || e.event_type === 'listing_message') b.messages++;
      });
      setTrend(Array.from(byDay.entries()).map(([date, v]) => ({
        date: date.slice(5),
        ...v,
      })));

      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!listing) return;
    setSaving(true);
    const price = parseInt(editPrice);
    const { error } = await supabase
      .from('listings')
      .update({
        price: isNaN(price) ? listing.price : price,
        description: editDesc,
        status: editStatus,
      } as any)
      .eq('id', listing.id);
    setSaving(false);
    if (error) return toast.error('Opslaan mislukt');
    toast.success('Wijzigingen opgeslagen');
    setListing({ ...listing, price: isNaN(price) ? listing.price : price, description: editDesc, status: editStatus });
  };

  const runInsight = async () => {
    if (!listing) return;
    setAiLoading(true);
    try {
      const mock = {
        averagePrice: Math.round(listing.price * 1.05),
        minPrice: Math.round(listing.price * 0.85),
        maxPrice: Math.round(listing.price * 1.25),
        comparableCount: 15,
        rating: 'fair',
      };
      const { data, error } = await supabase.functions.invoke('price-analysis', {
        body: {
          listing: {
            title: listing.title,
            year: listing.year,
            mileage: listing.mileage,
            fuelType: listing.fuel_type,
            transmission: listing.transmission,
            power: listing.power,
            features: [],
            price: listing.price,
          },
          analysis: mock,
        },
      });
      if (error) throw error;
      setAiInsight([data.summary, data.details, ...(data.tips ?? [])].filter(Boolean).join('\n\n'));
    } catch {
      toast.error('AI-analyse mislukt');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Voertuig niet gevonden.</p>
        <Button asChild className="mt-4"><Link to="/zakelijk/voorraad">Terug naar voorraad</Link></Button>
      </div>
    );
  }

  // Heuristic insights
  const conv = listing.views > 0 ? ((favorites + messages) / listing.views) * 100 : 0;
  const heuristics: string[] = [];
  if (listing.views > 50 && conv < 2) heuristics.push('Veel views maar weinig leads — overweeg titel of foto\'s te verbeteren.');
  if (listing.views < 20) heuristics.push('Weinig views — overweeg een Boost of betere zoekwoorden in de titel.');
  if (favorites > 5 && messages === 0) heuristics.push('Bezoekers tonen interesse maar nemen geen contact op — controleer prijs en beschrijving.');

  return (
    <div className="container py-6 space-y-5">
      <SEOHead title={`${listing.title} — Beheer`} description="Voertuig operating page" noindex />

      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/zakelijk/voorraad"><ArrowLeft className="h-4 w-4" /> Voorraad</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <img src={listing.images?.[0] || '/placeholder.svg'} alt={listing.title} className="h-28 w-40 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{listing.title}</h1>
          <p className="text-sm text-muted-foreground">
            {listing.year} · {listing.mileage?.toLocaleString('nl-NL')} km · {listing.fuel_type}
          </p>
          <p className="text-2xl font-bold text-primary mt-1">{formatPrice(listing.price)}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to={`/auto/${listing.id}`} target="_blank">
            <ExternalLink className="h-3.5 w-3.5" /> Publieke pagina
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="stats" className="space-y-5">
        <TabsList>
          <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Statistieken</TabsTrigger>
          <TabsTrigger value="edit" className="gap-1.5"><Pencil className="h-4 w-4" /> Bewerken</TabsTrigger>
          <TabsTrigger value="platforms" className="gap-1.5"><Globe2 className="h-4 w-4" /> Platforms</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" /> Insights</TabsTrigger>
        </TabsList>

        {/* Stats */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Views', value: listing.views, icon: Eye, color: 'text-primary' },
              { label: 'Favorieten', value: favorites, icon: Heart, color: 'text-accent' },
              { label: 'Berichten', value: messages, icon: MessageCircle, color: 'text-chart-3' },
              { label: 'Conversie', value: `${conv.toFixed(1)}%`, icon: TrendingUp, color: 'text-chart-2' },
            ].map((s) => (
              <Card key={s.label} className="border-border/60">
                <CardContent className="p-4">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <p className="text-2xl font-bold mt-2">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Trend (30 dagen)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="favorites" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="messages" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit */}
        <TabsContent value="edit">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Voertuig bewerken</CardTitle>
              <CardDescription>Pas prijs, beschrijving en status aan. Voor foto's gebruik je de volledige bewerk-wizard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Prijs (€)</Label>
                  <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="reserved">Gereserveerd</SelectItem>
                      <SelectItem value="sold">Verkocht</SelectItem>
                      <SelectItem value="draft">Concept</SelectItem>
                      <SelectItem value="inactive">Gepauzeerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Beschrijving</Label>
                <Textarea rows={6} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Wijzigingen opslaan'}</Button>
                <Button asChild variant="outline">
                  <Link to={`/verkopen?edit=${listing.id}`}>Volledige bewerk-wizard openen</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platforms */}
        <TabsContent value="platforms">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Platform-synchronisatie</CardTitle>
              <CardDescription>Status van publicatie op externe platforms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">VATUUR.</p>
                  <p className="text-xs text-muted-foreground">Standaardplatform</p>
                </div>
                <Badge variant="default">Live</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">AutoScout24</p>
                  <p className="text-xs text-muted-foreground">
                    {autoScout?.last_sync_at
                      ? `Laatste sync: ${new Date(autoScout.last_sync_at).toLocaleString('nl-NL')}`
                      : 'Nog niet gesynchroniseerd'}
                  </p>
                </div>
                {autoScout ? (
                  <Badge variant={autoScout.status === 'live' ? 'default' : autoScout.status === 'error' ? 'destructive' : 'secondary'}>
                    {autoScout.status}
                  </Badge>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/zakelijk/instellingen">Koppelen</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          {heuristics.length > 0 && (
            <Card className="border-border/60">
              <CardHeader><CardTitle className="text-base">Aanbevelingen</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {heuristics.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> AI Marktanalyse</CardTitle>
              <CardDescription>Vergelijk je prijs met de markt en krijg verkooptips.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={runInsight} disabled={aiLoading} className="gap-2">
                <Brain className="h-4 w-4" /> {aiLoading ? 'Analyseren…' : 'AI-analyse starten'}
              </Button>
              {aiInsight && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm whitespace-pre-wrap">
                  {aiInsight}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
