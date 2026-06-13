import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Only accept the form when a real recovery flow is in progress:
    //  - the URL hash carries Supabase's recovery token (legacy implicit flow)
    //  - OR the URL query carries a `code` param (PKCE flow)
    //  - OR the PASSWORD_RECOVERY auth event fires after Supabase processes the token
    const hash = window.location.hash;
    const search = window.location.search;
    const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token=');
    const isRecoveryPkce = new URLSearchParams(search).has('code');

    if (isRecoveryHash || isRecoveryPkce) {
      setHasRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecovery(true);
      }
      setChecking(false);
    });

    // After a brief wait, stop showing the spinner even if no event fired
    const timer = setTimeout(() => setChecking(false), 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Wachtwoord moet minimaal 8 tekens zijn', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Wachtwoorden komen niet overeen', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);
    if (error) {
      toast({ title: 'Reset mislukt', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Wachtwoord aangepast', description: 'Je kan nu inloggen met je nieuwe wachtwoord.' });
      await supabase.auth.signOut();
      navigate('/auth');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <SEOHead title="Wachtwoord resetten - VATUUR." description="Stel een nieuw wachtwoord in." noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size="lg" asLink />
          </div>
          <CardTitle>Nieuw wachtwoord instellen</CardTitle>
          <CardDescription>Kies een sterk wachtwoord van minimaal 8 tekens</CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p className="text-sm text-muted-foreground text-center">Laden...</p>
          ) : !hasRecovery ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Deze resetlink is ongeldig of verlopen. Vraag een nieuwe link aan.
              </p>
              <Button className="w-full" onClick={() => navigate('/auth')}>Terug naar inloggen</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nieuw wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimaal 8 tekens"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Herhaal wachtwoord"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Laden...' : 'Wachtwoord opslaan'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
