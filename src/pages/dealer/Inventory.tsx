import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Heart, MessageCircle, Car, Crown, Rocket, Pencil, CheckCircle2,
  Search as SearchIcon, ExternalLink, Trash2, Plus, FileSpreadsheet, Link2,
  BarChart3,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDealerAnalytics, type ListingAnalytics } from '@/hooks/useDealerAnalytics';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

const STATUS_LABEL: Record<string, string> = {
  active: 'Actief',
  reserved: 'Gereserveerd',
  sold: 'Verkocht',
  draft: 'Concept',
  inactive: 'Gepauzeerd',
  expired: 'Verlopen',
};

export default function Inventory() {
  const { overview, listings, loading, refresh } = useDealerAnalytics();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<{ id: string; price: string } | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.brand?.toLowerCase().includes(q) ||
        l.model?.toLowerCase().includes(q)
      );
    });
  }, [listings, query, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((l) => l.id)));
  };

  const bulkAction = async (action: 'premium' | 'boost' | 'sold' | 'delete') => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (action === 'delete') {
      if (!confirm(`${ids.length} advertenties verwijderen?`)) return;
      const { error } = await supabase.from('listings').delete().in('id', ids);
      if (error) return toast.error('Verwijderen mislukt');
      toast.success(`${ids.length} verwijderd`);
    } else {
      const updates =
        action === 'premium' ? { is_premium: true } :
        action === 'boost' ? { boost_until: new Date(Date.now() + 7 * 86400000).toISOString() } :
        { status: 'sold' };
      const { error } = await supabase.from('listings').update(updates as any).in('id', ids);
      if (error) return toast.error('Bulkactie mislukt');
      toast.success(`${ids.length} bijgewerkt`);
    }
    setSelectedIds(new Set());
    refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('listings').update({ status } as any).eq('id', id);
    toast.success('Status gewijzigd');
    refresh();
  };

  const savePrice = async () => {
    if (!editingPrice) return;
    const price = parseInt(editingPrice.price);
    if (isNaN(price) || price <= 0) return toast.error('Ongeldige prijs');
    await supabase.from('listings').update({ price } as any).eq('id', editingPrice.id);
    toast.success('Prijs bijgewerkt');
    setEditingPrice(null);
    refresh();
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-5">
      <SEOHead title="Voorraad — VATUUR. Zakelijk" description="Beheer je voertuigvoorraad." noindex />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" /> Voorraad
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {overview?.activeListings ?? 0} actief · {overview?.totalViews ?? 0} views ·{' '}
            {overview?.totalFavorites ?? 0} favorieten · {overview?.totalMessages ?? 0} berichten
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op titel, merk, model…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="reserved">Gereserveerd</SelectItem>
            <SelectItem value="sold">Verkocht</SelectItem>
            <SelectItem value="draft">Concept</SelectItem>
            <SelectItem value="inactive">Gepauzeerd</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} geselecteerd</span>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('premium')}>
            <Crown className="h-3.5 w-3.5" /> Premium
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('boost')}>
            <Rocket className="h-3.5 w-3.5" /> Boost
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('sold')}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Verkocht
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => bulkAction('delete')}>
            <Trash2 className="h-3.5 w-3.5" /> Verwijder
          </Button>
        </div>
      )}

      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {listings.length === 0 ? (
                <>
                  <p className="mb-1 font-medium">Nog geen voertuigen in je voorraad</p>
                  <p className="text-sm">Voeg je eerste auto toe, importeer een CSV of koppel AutoScout.</p>
                  <div className="mt-4 flex justify-center gap-2 flex-wrap">
                    <Button asChild><Link to="/verkopen?dealer=1">Voertuig toevoegen</Link></Button>
                    <Button asChild variant="outline"><Link to="/zakelijk/import">Import CSV</Link></Button>
                    <Button asChild variant="outline"><Link to="/zakelijk/instellingen">Koppel AutoScout</Link></Button>
                  </div>
                </>
              ) : (
                <p>Geen voertuigen met deze filters.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px]">Voertuig</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right"><Eye className="h-4 w-4 inline" /></TableHead>
                    <TableHead className="text-right"><Heart className="h-4 w-4 inline" /></TableHead>
                    <TableHead className="text-right"><MessageCircle className="h-4 w-4 inline" /></TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-center">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const conv = l.views > 0 ? ((l.favorites + l.conversations) / l.views * 100) : 0;
                    return (
                      <TableRow key={l.id} className={l.isPremium ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox checked={selectedIds.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} />
                        </TableCell>
                        <TableCell>
                          <Link to={`/zakelijk/voorraad/${l.id}`} className="flex items-center gap-3 hover:text-primary">
                            <img src={l.image || '/placeholder.svg'} alt={l.title} className="h-10 w-14 rounded-md object-cover flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm truncate max-w-[180px]">{l.title}</span>
                                {l.isPremium && <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{l.year} · {l.mileage?.toLocaleString('nl-NL')} km</p>
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
                              className="font-semibold text-sm hover:text-primary inline-flex items-center gap-1"
                              onClick={() => setEditingPrice({ id: l.id, price: String(l.price) })}
                            >
                              {formatPrice(l.price)}
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue>{STATUS_LABEL[l.status] ?? l.status}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Actief</SelectItem>
                              <SelectItem value="reserved">Gereserveerd</SelectItem>
                              <SelectItem value="sold">Verkocht</SelectItem>
                              <SelectItem value="draft">Concept</SelectItem>
                              <SelectItem value="inactive">Gepauzeerd</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-sm">{l.views}</TableCell>
                        <TableCell className="text-right text-sm">{l.favorites}</TableCell>
                        <TableCell className="text-right text-sm">{l.messages}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${conv > 5 ? 'text-chart-3' : conv > 2 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                            {conv.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                              <Link to={`/zakelijk/voorraad/${l.id}`}>
                                <Pencil className="h-3 w-3" /> Beheren
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                              <Link to={`/auto/${l.id}`} target="_blank" aria-label="Publieke pagina">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
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
