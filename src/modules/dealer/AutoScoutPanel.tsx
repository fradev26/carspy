import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ConnectionPublicationCard, {
  DEFAULT_PUBLICATION_SETTINGS,
  type PublicationSettings,
} from '@/components/dealer/ConnectionPublicationCard';

interface Credential {
  customer_id: string;
  username: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  has_password: boolean;
}

interface SyncRun {
  id: string;
  trigger: string;
  status: string;
  totals: any;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function AutoScoutPanel() {
  const { user } = useAuth();
  const [cred, setCred] = useState<Credential | null>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<null | 'save' | 'test' | 'sync' | 'pub'>(null);
  const [pub, setPub] = useState<PublicationSettings>(DEFAULT_PUBLICATION_SETTINGS);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: credRow }, { data: runRows }] = await Promise.all([
      supabase
        .from('autoscout_credentials')
        .select('customer_id, username, last_sync_at, last_sync_status, last_sync_error, password_secret_id, auto_publish, sync_direction, publish_new_vehicles, sync_price, sync_photos, sync_description, sync_specs, remove_on_sold, sync_stock, draft_mode, sync_schedule, sync_priority')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('autoscout_sync_runs')
        .select('id, trigger, status, totals, error_message, started_at, finished_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5),
    ]);
    if (credRow) {
      setCred({
        customer_id: (credRow as any).customer_id,
        username: (credRow as any).username,
        last_sync_at: (credRow as any).last_sync_at,
        last_sync_status: (credRow as any).last_sync_status,
        last_sync_error: (credRow as any).last_sync_error,
        has_password: !!(credRow as any).password_secret_id,
      });
      setCustomerId((credRow as any).customer_id ?? '');
      setUsername((credRow as any).username ?? '');
      const r = credRow as any;
      setPub({
        auto_publish: r.auto_publish ?? false,
        sync_direction: r.sync_direction ?? 'import_only',
        publish_new_vehicles: r.publish_new_vehicles ?? false,
        sync_price: r.sync_price ?? true,
        sync_photos: r.sync_photos ?? true,
        sync_description: r.sync_description ?? true,
        sync_specs: r.sync_specs ?? true,
        remove_on_sold: r.remove_on_sold ?? true,
        sync_stock: r.sync_stock ?? true,
        draft_mode: r.draft_mode ?? false,
        sync_schedule: r.sync_schedule ?? 'manual',
        sync_priority: r.sync_priority ?? 'normal',
      });
    } else {
      setCred(null);
      setPub(DEFAULT_PUBLICATION_SETTINGS);
    }
    setRuns((runRows ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const callFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('autoscout-sync', { body });
    if (error) throw new Error(error.message);
    if (data && (data as any).error) throw new Error((data as any).error);
    return data as any;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!customerId.trim() || !username.trim()) {
      toast.error('Customer ID en gebruikersnaam zijn verplicht');
      return;
    }
    if (!cred?.has_password && !password) {
      toast.error('Wachtwoord verplicht bij eerste opslag');
      return;
    }
    setBusy('save');
    try {
      await callFn({
        action: 'save_credentials',
        dealer_user_id: user.id,
        customer_id: customerId.trim(),
        username: username.trim(),
        ...(password ? { password } : {}),
      });
      setPassword('');
      toast.success('Credentials opgeslagen');
      await load();
    } catch (e: any) {
      toast.error(`Opslaan mislukt: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    if (!user) return;
    setBusy('test');
    try {
      const res = await callFn({ action: 'test_connection', dealer_user_id: user.id });
      if (res.ok) toast.success('Verbinding met AutoScout24 OK');
      else toast.error(`Verbinding mislukt: ${res.error ?? 'onbekend'}`);
    } catch (e: any) {
      toast.error(`Test mislukt: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setBusy('sync');
    try {
      const res = await callFn({ action: 'sync', dealer_user_id: user.id, trigger: 'manual' });
      const t = res.totals ?? {};
      toast.success(
        `Sync klaar — ${t.new ?? 0} nieuw, ${t.changed ?? 0} gewijzigd, ${t.unchanged ?? 0} ongewijzigd, ${t.errors ?? 0} fouten`,
      );
      await load();
    } catch (e: any) {
      toast.error(`Sync mislukt: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleSavePublication = async () => {
    if (!user) return;
    setBusy('pub');
    try {
      const { error } = await supabase
        .from('autoscout_credentials')
        .update(pub as any)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Publicatie-instellingen opgeslagen');
    } catch (e: any) {
      toast.error(`Opslaan mislukt: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };


  const statusBadge = (status: string | null) => {
    if (status === 'success') return <Badge className="bg-green-100 text-green-800">Succes</Badge>;
    if (status === 'error') return <Badge variant="destructive">Fout</Badge>;
    if (status === 'running') return <Badge variant="secondary">Bezig</Badge>;
    return <Badge variant="outline">—</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <CardTitle>AutoScout24-koppeling</CardTitle>
          </div>
          <CardDescription>
            Synchroniseer je voorraad rechtstreeks vanuit AutoScout24. Wachtwoord wordt versleuteld in onze kluis bewaard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="as-customer">Customer ID</Label>
              <Input
                id="as-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="bv. 12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-username">Gebruikersnaam</Label>
              <Input
                id="as-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="API username"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="as-password">
                Wachtwoord {cred?.has_password && <span className="text-xs text-muted-foreground">(laat leeg om bestaand te behouden)</span>}
              </Label>
              <Input
                id="as-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={cred?.has_password ? '••••••••' : 'API wachtwoord'}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={busy !== null}>
              {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Opslaan'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={busy !== null || !cred?.has_password}>
              {busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test verbinding'}
            </Button>
            <Button variant="default" onClick={handleSync} disabled={busy !== null || !cred?.has_password}>
              {busy === 'sync' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync nu
            </Button>
          </div>

          {cred && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Laatste sync:</span>
                <span>{fmtDate(cred.last_sync_at)}</span>
                {statusBadge(cred.last_sync_status)}
              </div>
              {cred.last_sync_error && (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span className="text-xs">{cred.last_sync_error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Recente sync-runs</CardTitle>
          <CardDescription>Laatste 5 synchronisaties van je AutoScout24-voorraad.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen runs.</p>
          ) : (
            <ul className="divide-y">
              {runs.map((r) => {
                const t = r.totals ?? {};
                return (
                  <li key={r.id} className="py-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-36 shrink-0">{fmtDate(r.started_at)}</span>
                    {statusBadge(r.status)}
                    <span className="text-xs text-muted-foreground">{r.trigger}</span>
                    {r.status === 'success' && (
                      <span className="text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {t.new ?? 0} nieuw · {t.changed ?? 0} gewijzigd · {t.unchanged ?? 0} ongewijzigd
                        {t.errors ? ` · ${t.errors} fouten` : ''}
                      </span>
                    )}
                    {r.error_message && <span className="text-xs text-destructive">{r.error_message}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
