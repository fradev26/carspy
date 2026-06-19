import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type State = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.valid) setState('valid');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      })
      .catch(() => setState('error'));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
    setSubmitting(false);
    if (error) { setState('error'); return; }
    if ((data as { success?: boolean })?.success) setState('success');
    else setState('already');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          VATUUR<span className="text-primary">.</span>
        </h1>

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uitnodiging controleren…</p>
          </div>
        )}

        {state === 'valid' && (
          <>
            <p className="text-muted-foreground">Wil je geen e-mails meer ontvangen van VATUUR?</p>
            <Button className="w-full" onClick={confirm} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bevestig uitschrijving'}
            </Button>
          </>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="font-medium">Je bent uitgeschreven.</p>
            <p className="text-sm text-muted-foreground">Je ontvangt geen e-mails meer van VATUUR.</p>
          </div>
        )}

        {state === 'already' && (
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Je was al uitgeschreven.</p>
          </div>
        )}

        {(state === 'invalid' || state === 'error') && (
          <div className="flex flex-col items-center gap-2 py-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="font-medium">Deze link is niet (meer) geldig.</p>
            <p className="text-sm text-muted-foreground">Probeer de meest recente e-mail of neem contact met ons op.</p>
          </div>
        )}
      </Card>
    </main>
  );
}
