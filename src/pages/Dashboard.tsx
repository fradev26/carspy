import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockListings } from '@/data/mockListings';

export default function Dashboard() {
  const myListings = mockListings.slice(0, 3);
  const formatPrice = (price: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

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
          <TabsTrigger value="listings">Mijn advertenties</TabsTrigger>
          <TabsTrigger value="messages">Berichten</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6 space-y-4">
          {myListings.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Je hebt nog geen advertenties</p>
              <Button asChild className="mt-4"><Link to="/verkopen">Plaats je eerste advertentie</Link></Button>
            </CardContent></Card>
          ) : (
            myListings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
                  <img src={listing.images[0] || '/placeholder.svg'} alt={listing.title} className="h-24 w-32 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{listing.title}</h3>
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
                    <Button variant="outline" size="sm" className="gap-2"><Edit className="h-4 w-4" />Bewerken</Button>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Verwijderen</Button>
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
