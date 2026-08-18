import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, MessageCircle, TrendingUp, Car, BarChart3, ArrowLeft, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ListingAnalytics {
  id: string;
  title: string;
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
}

interface Overview {
  totalViews: number;
  totalFavorites: number;
  totalMessages: number;
  totalListings: number;
  activeListings: number;
}

export default function DealerDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [listings, setListings] = useState<ListingAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const togglePremium = async (listingId: string, currentPremium: boolean) => {
    // Premium is betaalde plaatsing: alleen via de server-side, abonnements-
    // gecontroleerde functie (directe kolomwrites zijn geblokkeerd).
    const { error } = await supabase.rpc('set_listing_premium', {
      _listing_id: listingId,
      _enabled: !currentPremium,
    });
    if (error) {
      toast.error(
        error.message.includes('paid subscription')
          ? 'Premium vereist een actief betaald abonnement'
          : 'Kon premium status niet wijzigen',
      );
    } else {
      toast.success(!currentPremium ? 'Listing is nu Premium!' : 'Premium uitgeschakeld');
      fetchAnalytics();
    }
  };

  const boostListing = async (listingId: string) => {
    // Boost loopt altijd via de facturatie-gecontroleerde RPC (quota + kosten).
    const { error } = await supabase.rpc('activate_boost', {
      _listing_id: listingId,
      _package_code: 'turbo',
    });
    if (error) {
      toast.error('Kon listing niet boosten');
    } else {
      toast.success('Listing geboost voor 7 dagen!');
      fetchAnalytics();
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

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
    { label: 'Totaal views', value: overview?.totalViews ?? 0, icon: Eye, color: 'text-primary-strong' },
    { label: 'Favorieten', value: overview?.totalFavorites ?? 0, icon: Heart, color: 'text-accent' },
    { label: 'Berichten', value: overview?.totalMessages ?? 0, icon: MessageCircle, color: 'text-success' },
    { label: 'Actieve listings', value: overview?.activeListings ?? 0, icon: Car, color: 'text-warning' },
  ];

  // Chart data: top 6 listings by views
  const chartData = [...listings]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .map((l) => ({
      name: l.title.length > 20 ? l.title.substring(0, 20) + '…' : l.title,
      Views: l.views,
      Favorieten: l.favorites,
      Berichten: l.messages,
    }));

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
            <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary-strong" />
              Dealer Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overzicht van je advertentieprestaties
            </p>
          </div>
        </div>
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

      {/* Chart */}
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
                  <Bar dataKey="Berichten" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Alle advertenties</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Nog geen advertenties geplaatst</p>
              <Button asChild className="mt-4">
                <Link to="/verkopen">Plaats je eerste advertentie</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Advertentie</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">
                      <Eye className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-right">
                      <Heart className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-right">
                      <MessageCircle className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-right">Conversie</TableHead>
                    <TableHead className="text-center">Premium / Boost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((l) => {
                    const conversionRate = l.views > 0 ? ((l.favorites + l.conversations) / l.views * 100) : 0;
                    const isBoosted = l.boostUntil && new Date(l.boostUntil) > new Date();
                    return (
                      <TableRow key={l.id} className={l.isPremium ? 'bg-premium/5' : ''}>
                        <TableCell>
                          <Link to={`/auto/${l.id}`} className="flex items-center gap-3 hover:text-primary-strong transition-colors">
                            <img
                              src={l.image || '/placeholder.svg'}
                              alt={l.title}
                              className="h-10 w-14 rounded-md object-cover flex-shrink-0"
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate max-w-[180px]">{l.title}</span>
                              {l.isPremium && <Crown className="h-3.5 w-3.5 text-premium flex-shrink-0" />}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">{formatPrice(l.price)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={l.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {l.status === 'active' ? 'Actief' : l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{l.views}</TableCell>
                        <TableCell className="text-right text-sm">{l.favorites}</TableCell>
                        <TableCell className="text-right text-sm">{l.messages}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${conversionRate > 5 ? 'text-success' : conversionRate > 2 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {conversionRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant={l.isPremium ? 'default' : 'outline'}
                              size="sm"
                              className={l.isPremium ? 'bg-premium hover:bg-premium/90 text-premium-foreground h-7 text-xs gap-1' : 'h-7 text-xs gap-1'}
                              onClick={() => togglePremium(l.id, l.isPremium)}
                            >
                              <Crown className="h-3 w-3" />
                              {l.isPremium ? 'Premium' : 'Maak Premium'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 text-xs gap-1 ${isBoosted ? 'text-primary-strong border-primary/50' : ''}`}
                              onClick={() => boostListing(l.id)}
                              disabled={!!isBoosted}
                            >
                              <Rocket className="h-3 w-3" />
                              {isBoosted ? 'Geboost' : 'Boost'}
                            </Button>
                          </div>
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
    </div>
  );
}
