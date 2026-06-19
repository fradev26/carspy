import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RoleBadge } from '@/components/dealer/RoleBadge';
import type { CompanyRole } from '@/hooks/usePermissions';

type PeekResult =
  | { valid: true; email: string; role: CompanyRole; company_name: string; expires_at: string }
  | { valid: false; reason: 'not_found' | 'used' | 'revoked' | 'expired' };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [peek, setPeek] = useState<PeekResult | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase.rpc('peek_invitation', { _token: token }).then(({ data, error }) => {
      if (error) setPeek({ valid: false, reason: 'not_found' });
      else setPeek(data as PeekResult);
    });
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    const { error } = await supabase.rpc('accept_invitation', { _token: token });
    setAccepting(false);
    if (error) {
      toast({ title: 'Accepteren mislukt', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Welkom!', description: 'Je bent toegevoegd aan het dealeraccount.' });
    navigate('/zakelijk', { replace: true });
  };

  if (!token) return <div className="container py-10 text-center">Geen uitnodigingstoken aanwezig.</div>;
  if (!peek) return <div className="container py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  if (!peek.valid) {
    const reasons: Record<string, string> = {
      not_found: 'Deze uitnodigingslink is ongeldig.',
      used: 'Deze uitnodiging is al gebruikt.',
      revoked: 'Deze uitnodiging is ingetrokken.',
      expired: 'Deze uitnodiging is verlopen. Vraag een nieuwe aan.',
    };
    return (
      <div className="container max-w-md py-12">
        <Helmet><title>Uitnodiging \u2014 VATUUR</title></Helmet>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /> Niet geldig</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{reasons[peek.reason]}</p>
            <Button asChild className="mt-4 w-full"><Link to="/">Naar startpagina</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-12">
      <Helmet><title>Uitnodiging \u2014 {peek.company_name}</title></Helmet>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Je bent uitgenodigd</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Word lid van</div>
            <div className="text-xl font-semibold">{peek.company_name}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rol:</span> <RoleBadge role={peek.role} />
          </div>
          <div className="text-sm text-muted-foreground">Voor: <strong>{peek.email}</strong></div>

          {!user ? (
            <div className="space-y-2">
              <p className="text-sm">Log eerst in (of maak een account) met dit e-mailadres om de uitnodiging te accepteren.</p>
              <Button asChild className="w-full">
                <Link to={`/auth?email=${encodeURIComponent(peek.email)}&next=${encodeURIComponent('/uitnodiging?token=' + token)}`}>
                  Inloggen of registreren
                </Link>
              </Button>
            </div>
          ) : user.email?.toLowerCase() !== peek.email.toLowerCase() ? (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm">
              Je bent ingelogd als <strong>{user.email}</strong>. Log uit en log in als <strong>{peek.email}</strong> om deze uitnodiging te accepteren.
            </div>
          ) : (
            <Button className="w-full" onClick={accept} disabled={accepting}>
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Uitnodiging accepteren</>}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
