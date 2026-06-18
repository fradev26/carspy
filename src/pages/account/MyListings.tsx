import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Heart, MessageCircle, Edit, Trash2, RotateCcw, CheckCircle2, Car } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MyListing {
  id: string;
  title: string;
  price: number | null;
  status: string;
  views: number;
  images: string[] | null;
  created_at: string;
  boost_until: string | null;
  favorites: number;
  conversations: number;
}

const formatPrice = (price: number | null) =>
  price == null ? '—' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

function bucketFor(l: MyListing): 'active' | 'draft' | 'expired' | 'sold' {
  if (l.status === 'sold') return 'sold';
  if (l.status === 'draft') return 'draft';
  if (l.status === 'expired' || l.status === 'inactive') return 'expired';
  return 'active';
}

export default function MyListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from('listings')
      .select('id, title, price, status, views, images, created_at, boost_until')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    const base = (rows ?? []) as Omit<MyListing, 'favorites' | 'conversations'>[];
    const ids = base.map((l) => l.id);

    const [favRes, convRes] = await Promise.all([
      ids.length
        ? supabase.from('favorites').select('listing_id').in('listing_id', ids)
        : Promise.resolve({ data: [] as { listing_id: string }[] }),
      ids.length
        ? supabase.from('conversations').select('id, listing_id').in('listing_id', ids)
        : Promise.resolve({ data: [] as { id: string; listing_id: string }[] }),
    ]);

    const favMap = new Map<string, number>();
    (favRes.data ?? []).forEach((r) => favMap.set(r.listing_id, (favMap.get(r.listing_id) ?? 0) + 1));
    const convMap = new Map<string, number>();
    (convRes.data ?? []).forEach((r) => convMap.set(r.listing_id, (convMap.get(r.listing_id) ?? 0) + 1));

    setListings(
      base.map((l) => ({
        ...l,
        favorites: favMap.get(l.id) ?? 0,
        conversations: convMap.get(l.id) ?? 0,
      })),
    );
    setLoading(false);
  }

  async function markSold(id: string) {
    const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', id);
    if (error) return toast({ title: 'Kon niet markeren', variant: 'destructive' });
    toast({ title: 'Gemarkeerd als verkocht' });
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sold' } : l)));
  }

  async function extend(id: string) {
    const until = new Date();
    until.setDate(until.getDate() + 30);
    const { error } = await supabase.from('listings').update({ status: 'active', boost_until: until.toISOString() }).eq('id', id);
    if (error) return toast({ title: 'Verlengen mislukt', variant: 'destructive' });
    toast({ title: 'Advertentie verlengd met 30 dagen' });
    load();
  }

  async function relist(id: string) {
    const { error } = await supabase.from('listings').update({ status: 'active', sold_at: null }).eq('id', id);
    if (error) return toast({ title: 'Opnieuw plaatsen mislukt', variant: 'destructive' });
    toast({ title: 'Advertentie staat weer te koop' });
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'active' } : l)));
  }

  async function remove(id: string) {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) return toast({ title: 'Verwijderen mislukt', variant: 'destructive' });
    toast({ title: 'Advertentie verwijderd' });
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  const buckets = useMemo(() => {
    const all = { active: [] as MyListing[], draft: [] as MyListing[], expired: [] as MyListing[], sold: [] as MyListing[] };
    listings.forEach((l) => all[bucketFor(l)].push(l));
    return all;
  }, [listings]);

  return (
    <div className="container py-8">
      <SEOHead title="Mijn advertenties — VATUUR." description="Beheer je VATUUR-advertenties." noindex />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mijn advertenties</h1>
          <p className="text-sm text-muted-foreground">Beheer, verleng en analyseer je voertuigen.</p>
        </div>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/verkopen"><Plus className="h-4 w-4" />Nieuwe advertentie</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <Tabs defaultValue="active" className="mt-6">
          <TabsList>
            <TabsTrigger value="active">Actief ({buckets.active.length})</TabsTrigger>
            <TabsTrigger value="draft">Concepten ({buckets.draft.length})</TabsTrigger>
            <TabsTrigger value="expired">Verlopen ({buckets.expired.length})</TabsTrigger>
            <TabsTrigger value="sold">Verkocht ({buckets.sold.length})</TabsTrigger>
          </TabsList>

          {(['active', 'draft', 'expired', 'sold'] as const).map((key) => (
            <TabsContent key={key} value={key} className="mt-6 space-y-4">
              {buckets[key].length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <Car className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">Je hebt nog geen advertenties in deze categorie.</p>
                    <Button asChild className="mt-2"><Link to="/verkopen">Plaats je eerste advertentie</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                buckets[key].map((l) => (
                  <Card key={l.id}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                      <img src={l.images?.[0] || '/placeholder.svg'} alt={l.title} className="h-24 w-32 rounded-lg object-cover" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to={`/auto/${l.id}`} className="font-semibold hover:text-primary truncate block">{l.title}</Link>
                            <p className="text-lg font-bold text-accent">{formatPrice(l.price)}</p>
                          </div>
                          <Badge variant={key === 'active' ? 'default' : key === 'sold' ? 'secondary' : 'outline'}>
                            {key === 'active' && 'Actief'}
                            {key === 'draft' && 'Concept'}
                            {key === 'expired' && 'Verlopen'}
                            {key === 'sold' && 'Verkocht'}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{l.views} weergaven</span>
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{l.favorites} favorieten</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{l.conversations} berichten</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <Link to={`/auto/${l.id}`}><Eye className="h-4 w-4" />Bekijken</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <Link to={`/verkopen?edit=${l.id}`}><Edit className="h-4 w-4" />Bewerken</Link>
                        </Button>
                        {(key === 'expired' || key === 'draft') && (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => extend(l.id)}>
                            <RotateCcw className="h-4 w-4" />Verlengen
                          </Button>
                        )}
                        {key === 'active' && (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => markSold(l.id)}>
                            <CheckCircle2 className="h-4 w-4" />Verkocht
                          </Button>
                        )}
                        {key === 'sold' && (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => relist(l.id)}>
                            <RotateCcw className="h-4 w-4" />Terug te koop
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Verwijderen</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Advertentie verwijderen?</AlertDialogTitle>
                              <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(l.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
