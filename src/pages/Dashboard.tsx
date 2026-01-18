import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  images: string[];
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, status, views, images, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    } else {
      toast({ title: 'Advertentie verwijderd' });
      setListings(listings.filter(l => l.id !== id));
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/verkopen"><Plus className="h-4 w-4" />Nieuwe advertentie</Link>
        </Button>
      </div>

      <Tabs defaultValue="listings" className="mt-8">
        <TabsList>
          <TabsTrigger value="listings">Mijn advertenties ({listings.length})</TabsTrigger>
          <TabsTrigger value="messages">Berichten</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6 space-y-4">
          {listings.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Je hebt nog geen advertenties</p>
              <Button asChild className="mt-4"><Link to="/verkopen">Plaats je eerste advertentie</Link></Button>
            </CardContent></Card>
          ) : (
            listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
                  <img 
                    src={listing.images?.[0] || '/placeholder.svg'} 
                    alt={listing.title} 
                    className="h-24 w-32 rounded-lg object-cover" 
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/auto/${listing.id}`} className="font-semibold hover:text-primary">{listing.title}</Link>
                        <p className="text-lg font-bold text-accent">{formatPrice(listing.price)}</p>
                      </div>
                      <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                        {listing.status === 'active' ? 'Actief' : listing.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{listing.views} views</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <Link to={`/verkopen?edit=${listing.id}`}><Edit className="h-4 w-4" />Bewerken</Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-destructive"
                      onClick={() => handleDelete(listing.id)}
                    >
                      <Trash2 className="h-4 w-4" />Verwijderen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card><CardContent className="py-12 text-center text-muted-foreground">Berichten functie komt binnenkort beschikbaar</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
