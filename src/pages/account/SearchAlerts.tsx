import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search as SearchIcon, Trash2, Pause, Play } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AlertRow {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
  paused: boolean;
  frequency: string;
}

function summarize(f: Record<string, unknown>): string {
  const parts: string[] = [];
  if (f.brand) parts.push(String(f.brand));
  if (f.model) parts.push(String(f.model));
  if (f.minPrice || f.maxPrice) parts.push(`€${f.minPrice ?? 0} – €${f.maxPrice ?? '∞'}`);
  if (f.location || f.province) parts.push(String(f.location ?? f.province));
  return parts.join(' · ') || 'Alle wagens';
}

export default function SearchAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('saved_searches')
      .select('id, name, filters, created_at, paused, frequency')
      .order('created_at', { ascending: false });
    setAlerts((data ?? []) as AlertRow[]);
    setLoading(false);
  }

  async function togglePause(a: AlertRow) {
    const { error } = await supabase.from('saved_searches').update({ paused: !a.paused }).eq('id', a.id);
    if (error) return toast({ title: 'Fout', variant: 'destructive' });
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, paused: !x.paused } : x)));
  }

  async function changeFreq(a: AlertRow, frequency: string) {
    const { error } = await supabase.from('saved_searches').update({ frequency }).eq('id', a.id);
    if (error) return toast({ title: 'Fout', variant: 'destructive' });
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, frequency } : x)));
    toast({ title: 'Frequentie aangepast' });
  }

  async function remove(id: string) {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) return toast({ title: 'Fout', variant: 'destructive' });
    setAlerts((prev) => prev.filter((x) => x.id !== id));
    toast({ title: 'Alert verwijderd' });
  }

  function openSearch(a: AlertRow) {
    const params = new URLSearchParams();
    Object.entries(a.filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, Array.isArray(v) ? v.join(',') : String(v));
    });
    navigate(`/zoeken?${params.toString()}`);
  }

  return (
    <div className="container py-8">
      <SEOHead title="Zoekalerts — VATUUR." description="Beheer je opgeslagen zoekopdrachten en meldingen." noindex />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zoekalerts</h1>
          <p className="text-sm text-muted-foreground">Krijg een melding zodra een matchende wagen online komt.</p>
        </div>
        <Button asChild variant="outline" className="gap-2"><Link to="/zoeken"><SearchIcon className="h-4 w-4" />Nieuwe zoekopdracht</Link></Button>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : alerts.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Nog geen zoekalerts</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Stel filters in op de zoekpagina en sla je zoekopdracht op. We mailen je zodra een nieuwe wagen aansluit op je criteria.
            </p>
            <Button asChild className="mt-2"><Link to="/zoeken">Ga zoeken</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {alerts.map((a) => (
            <Card key={a.id} className={a.paused ? 'opacity-70' : ''}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{a.name}</h3>
                    {a.paused && <Badge variant="secondary">Gepauzeerd</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">{summarize(a.filters)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Opgeslagen op {new Date(a.created_at).toLocaleDateString('nl-NL')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={a.frequency} onValueChange={(v) => changeFreq(a, v)}>
                    <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Direct</SelectItem>
                      <SelectItem value="daily">Dagelijks</SelectItem>
                      <SelectItem value="weekly">Wekelijks</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => togglePause(a)}>
                    {a.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {a.paused ? 'Hervat' : 'Pauzeer'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openSearch(a)}>
                    <SearchIcon className="h-4 w-4" />Zoeken
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => remove(a.id)} aria-label="Verwijder alert">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
