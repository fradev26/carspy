import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MyLeadsPanel from '@/components/MyLeadsPanel';
import {
  Eye, Heart, MessageCircle, TrendingUp, Car, BarChart3, Crown, Rocket,
  DollarSign, Clock, Brain, Search as SearchIcon, Pencil, CheckCircle2
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ListingAnalytics {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  price: number;
  status: string;
  views: number;
  image: string | null;
  createdAt: string;
  favorites: number;
  conversations: number;
  messages: number;
  isPremium: boolean;
  boostUntil: string | null;
  features: string[];
  transmission: string;
  power: number | null;
}

interface Overview {
  totalViews: number;
  totalFavorites: number;
  totalMessages: number;
  totalListings: number;
  activeListings: number;
}

interface PriceAnalysis {
  summary: string;
  details: string;
  tips: string[];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

// --- AI Price Analysis Component ---
function AIPriceAnalysisPanel({ listing }: { listing: ListingAnalytics }) {
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const mockMarket = {
        averagePrice: Math.round(listing.price * 1.05),
        minPrice: Math.round(listing.price * 0.85),
        maxPrice: Math.round(listing.price * 1.25),
        comparableCount: Math.floor(Math.random() * 30) + 5,
        rating: listing.price < listing.price * 1.05 ? 'good' : 'fair',
      };
      const { data, error } = await supabase.functions.invoke('price-analysis', {
        body: {
          listing: {
            title: listing.title,
            year: listing.year,
            mileage: listing.mileage,
            fuelType: listing.fuelType,
            transmission: listing.transmission,
            power: listing.power,
            features: listing.features,
            price: listing.price,
          },
          analysis: mockMarket,
        },
      });
      if (error) throw error;
      setAnalysis(data);
    } catch {
      toast.error('AI-analyse kon niet worden geladen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!analysis ? (
        <Button variant="outline" size="sm" className="gap-2" onClick={runAnalysis} disabled={loading}>
          <Brain className="h-4 w-4" />
          {loading ? 'Analyseren...' : 'AI Marktanalyse'}
        </Button>
      ) : (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 text-sm">
          <p className="font-semibold text-primary">{analysis.summary}</p>
          <p className="text-muted-foreground">{analysis.details}</p>
          {analysis.tips?.length > 0 && (
            <ul className="space-y-1">
              {analysis.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- Market Explorer Component ---
function MarketExplorer() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('benzine');
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !year) {
      toast.error('Vul merk, model en bouwjaar in');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const estimatedPrice = 15000 + Math.random() * 30000;
      const mockMarket = {
        averagePrice: Math.round(estimatedPrice),
        minPrice: Math.round(estimatedPrice * 0.8),
        maxPrice: Math.round(estimatedPrice * 1.3),
        comparableCount: Math.floor(Math.random() * 40) + 3,
        rating: 'fair',
      };
      const { data, error } = await supabase.functions.invoke('price-analysis', {
        body: {
          listing: {
            title: `${brand} ${model} ${year}`,
            year: parseInt(year),
            mileage: parseInt(mileage) || 50000,
            fuelType,
            transmission: 'handgeschakeld',
            power: null,
            features: [],
            price: Math.round(estimatedPrice),
          },
          analysis: mockMarket,
        },
      });
      if (error) throw error;
      setAnalysis(data);
    } catch {
      toast.error('Analyse mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <SearchIcon className="h-5 w-5 text-primary" />
          Marktverkenner
        </CardTitle>
        <CardDescription>Analyseer de marktwaarde van een wagentype dat nog niet in je voorraad zit</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAnalysis} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Merk</Label>
            <Input placeholder="bijv. BMW" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Model</Label>
            <Input placeholder="bijv. 3 Serie" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bouwjaar</Label>
            <Input type="number" placeholder="2021" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kilometerstand</Label>
            <Input type="number" placeholder="50000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Brandstof</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="benzine">Benzine</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="elektrisch">Elektrisch</SelectItem>
                <SelectItem value="hybride">Hybride</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Brain className="h-4 w-4" />
              {loading ? 'Analyseren...' : 'Analyseer'}
            </Button>
          </div>
        </form>

        {analysis && (
          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="font-semibold text-primary">{analysis.summary}</p>
            <p className="text-sm text-muted-foreground">{analysis.details}</p>
            {analysis.tips?.length > 0 && (
              <ul className="space-y-1 mt-2">
                {analysis.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Dashboard ---
export default function BusinessDashboard() {
  const { user } = useAuth();
  const { profile, isDealer } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabAlias: Record<string, string> = {
    overzicht: 'inventory',
    voorraad: 'inventory',
    statistieken: 'performance',
    leads: 'leads',
    marktverkenner: 'explorer',
  };
  const initialTab = tabAlias[searchParams.get('tab') ?? ''] ?? 'inventory';
  const [overview, setOverview] = useState<Overview | null>(null);
  const [listings, setListings] = useState<ListingAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<{ id: string; price: string } | null>(null);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('dealer-analytics');
      if (fnError) throw fnError;
      setOverview(data.overview);
      setListings(data.listings);
    } catch {
      setError('Kon analytics niet laden');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  };

  const bulkAction = async (action: 'premium' | 'boost') => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const updates = action === 'premium'
      ? { is_premium: true }
      : { boost_until: new Date(Date.now() + 7 * 86400000).toISOString() };

    const { error } = await supabase.from('listings').update(updates as any).in('id', ids);
    if (error) {
      toast.error('Bulkactie mislukt: ' + error.message);
      return;
    }
    toast.success(`${ids.length} listings ${action === 'premium' ? 'Premium gemaakt' : 'geboost'}!`);
    setSelectedIds(new Set());
    fetchAnalytics();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('listings').update({ status } as any).eq('id', id);
    toast.success('Status gewijzigd');
    fetchAnalytics();
  };

  const savePrice = async () => {
    if (!editingPrice) return;
    const price = parseInt(editingPrice.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Ongeldige prijs');
      return;
    }
    await supabase.from('listings').update({ price } as any).eq('id', editingPrice.id);
    toast.success('Prijs bijgewerkt');
    setEditingPrice(null);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchAnalytics} className="mt-4">Opnieuw proberen</Button>
      </div>
    );
  }

  const statCards = [
    { label: 'Actieve listings', value: overview?.activeListings ?? 0, icon: Car, color: 'text-primary' },
    { label: 'Totaal views', value: overview?.totalViews ?? 0, icon: Eye, color: 'text-chart-1' },
    { label: 'Favorieten', value: overview?.totalFavorites ?? 0, icon: Heart, color: 'text-accent' },
    { label: 'Berichten', value: overview?.totalMessages ?? 0, icon: MessageCircle, color: 'text-chart-3' },
  ];

  const chartData = [...listings]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .map((l) => ({
      name: l.title.length > 18 ? l.title.substring(0, 18) + '…' : l.title,
      Views: l.views,
      Favorieten: l.favorites,
      Berichten: l.messages,
    }));

  return (
    <div className="container py-8 space-y-8">
      <SEOHead title="Zakelijk Dashboard - VATUUR." description="Beheer je voorraad en bekijk prestaties." noindex />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Zakelijk Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {profile?.dealer_name ?? 'Welkom'} — overzicht van je voorraad en prestaties
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold mt-3">{stat.value.toLocaleString('nl-NL')}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6" onValueChange={(v) => {
        const sp = new URLSearchParams(searchParams);
        sp.set('tab', v);
        setSearchParams(sp, { replace: true });
      }}>
        <TabsList>
          <TabsTrigger value="inventory">Voorraad</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="performance">Statistieken</TabsTrigger>
          <TabsTrigger value="explorer">Marktverkenner</TabsTrigger>
          <TabsTrigger value="autoscout">AutoScout24</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <MyLeadsPanel />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <span className="text-sm font-medium">{selectedIds.size} geselecteerd</span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('premium')}>
                <Crown className="h-3.5 w-3.5" /> Premium maken
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('boost')}>
                <Rocket className="h-3.5 w-3.5" /> Boosten
              </Button>
            </div>
          )}

          <Card className="border-border/60">
            <CardContent className="p-0">
              {listings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>Nog geen advertenties</p>
                  <Button asChild className="mt-4"><Link to="/verkopen?dealer=1">Plaats advertentie</Link></Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={selectedIds.size === listings.length && listings.length > 0} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                        <TableHead className="min-w-[180px]">Advertentie</TableHead>
                        <TableHead className="text-right">Prijs</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right"><Eye className="h-4 w-4 inline" /></TableHead>
                        <TableHead className="text-right"><Heart className="h-4 w-4 inline" /></TableHead>
                        <TableHead className="text-right">Conversie</TableHead>
                        <TableHead className="text-center">Acties</TableHead>
                        <TableHead>AI Analyse</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.map((l) => {
                        const conversionRate = l.views > 0 ? ((l.favorites + l.conversations) / l.views * 100) : 0;
                        const isBoosted = l.boostUntil && new Date(l.boostUntil) > new Date();
                        return (
                          <TableRow key={l.id} className={l.isPremium ? 'bg-primary/5' : ''}>
                            <TableCell>
                              <Checkbox checked={selectedIds.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} />
                            </TableCell>
                            <TableCell>
                              <Link to={`/auto/${l.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                                <img src={l.image || '/placeholder.svg'} alt={l.title} className="h-10 w-14 rounded-md object-cover flex-shrink-0" />
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate max-w-[160px]">{l.title}</span>
                                  {l.isPremium && <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className="text-right">
                              {editingPrice?.id === l.id ? (
                                <div className="flex items-center gap-1 justify-end">
                                  <Input
                                    type="number"
                                    className="w-24 h-7 text-xs"
                                    value={editingPrice.price}
                                    onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && savePrice()}
                                  />
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={savePrice}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  className="font-semibold text-sm hover:text-primary transition-colors inline-flex items-center gap-1"
                                  onClick={() => setEditingPrice({ id: l.id, price: String(l.price) })}
                                >
                                  {formatPrice(l.price)}
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                                <SelectTrigger className="h-7 w-28 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Actief</SelectItem>
                                  <SelectItem value="reserved">Gereserveerd</SelectItem>
                                  <SelectItem value="sold">Verkocht</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right text-sm">{l.views}</TableCell>
                            <TableCell className="text-right text-sm">{l.favorites}</TableCell>
                            <TableCell className="text-right">
                              <span className={`text-sm font-medium ${conversionRate > 5 ? 'text-chart-3' : conversionRate > 2 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                                {conversionRate.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  variant={l.isPremium ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={async () => {
                                    await supabase.from('listings').update({ is_premium: !l.isPremium } as any).eq('id', l.id);
                                    toast.success(l.isPremium ? 'Premium uit' : 'Premium aan');
                                    fetchAnalytics();
                                  }}
                                >
                                  <Crown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-xs gap-1 ${isBoosted ? 'text-primary border-primary/50' : ''}`}
                                  onClick={async () => {
                                    await supabase.from('listings').update({ boost_until: new Date(Date.now() + 7 * 86400000).toISOString() } as any).eq('id', l.id);
                                    toast.success('Geboost!');
                                    fetchAnalytics();
                                  }}
                                  disabled={!!isBoosted}
                                >
                                  <Rocket className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <AIPriceAnalysisPanel listing={l} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {chartData.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Prestaties per listing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="name" angle={-25} textAnchor="end" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                      <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Favorieten" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Berichten" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top performers */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Top-performers</CardTitle>
              <CardDescription>Je best presterende advertenties op basis van conversieratio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...listings]
                .filter((l) => l.views > 0)
                .sort((a, b) => {
                  const rA = (a.favorites + a.conversations) / a.views;
                  const rB = (b.favorites + b.conversations) / b.views;
                  return rB - rA;
                })
                .slice(0, 5)
                .map((l, i) => {
                  const rate = ((l.favorites + l.conversations) / l.views * 100).toFixed(1);
                  return (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <img src={l.image || '/placeholder.svg'} alt="" className="h-8 w-12 rounded object-cover" />
                        <span className="text-sm font-medium">{l.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-primary">{rate}%</span>
                        <p className="text-xs text-muted-foreground">{l.views} views</p>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Explorer Tab */}
        <TabsContent value="explorer">
          <MarketExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
