import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Logo } from '@/components/Logo';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VAT_PATTERNS, normalizeVat, type VatCountry } from '@/lib/vat';

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Vul alle velden in', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({
        title: 'Inloggen mislukt',
        description: error.message === 'Invalid login credentials' ? 'Onjuiste email of wachtwoord' : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Welkom terug!' });
      // Redirect back to the page the user came from (via ProtectedRoute), else home
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from && from !== '/auth' ? from : '/', { replace: true });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Vul je emailadres in', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    const { error } = await resetPassword(resetEmail);
    setResetLoading(false);
    if (error) {
      toast({ title: 'Versturen mislukt', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Check je inbox',
        description: 'We hebben je een link gestuurd om je wachtwoord opnieuw in te stellen.',
      });
      setMode('login');
      setResetEmail('');
    }
  };

  if (mode === 'forgot') {
    return (
      <form onSubmit={handleForgot} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="naam@voorbeeld.nl"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Vul je emailadres in en we sturen een link om een nieuw wachtwoord in te stellen.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={resetLoading}>
          {resetLoading ? 'Versturen...' : 'Verstuur resetlink'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setMode('login')}
        >
          Terug naar inloggen
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" placeholder="naam@voorbeeld.nl" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Wachtwoord</Label>
        <div className="relative">
          <Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="button" variant="ghost" size="icon" aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'} className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="text-xs text-primary-strong hover:underline focus-ring rounded"
          >
            Wachtwoord vergeten?
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Laden...' : 'Inloggen'}
      </Button>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [dealerName, setDealerName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [vatCountry, setVatCountry] = useState<VatCountry>('BE');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({ title: 'Vul alle velden in', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Wachtwoord moet minimaal 6 tekens zijn', variant: 'destructive' });
      return;
    }
    if (isBusiness) {
      if (!dealerName.trim()) {
        toast({ title: 'Bedrijfsnaam is verplicht', variant: 'destructive' });
        return;
      }
      const pattern = VAT_PATTERNS[vatCountry];
      const normalized = normalizeVat(vatNumber, vatCountry);
      if (!pattern.regex.test(normalized)) {
        toast({ title: 'Ongeldig ondernemingsnummer', description: pattern.hint, variant: 'destructive' });
        return;
      }
    }

    setIsLoading(true);
    const dealerOptions = isBusiness ? { dealerName: dealerName.trim(), vatNumber: normalizeVat(vatNumber, vatCountry) } : undefined;
    const { error } = await signUp(email, password, name, dealerOptions);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'Dit emailadres is al geregistreerd';
      }
      toast({ title: 'Registratie mislukt', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Account aangemaakt!', description: 'Je bent nu ingelogd.' });
      navigate(isBusiness ? '/zakelijk' : '/');
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Naam</Label>
        <Input id="signup-name" type="text" autoComplete="name" placeholder="Je naam" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" autoComplete="email" placeholder="naam@voorbeeld.nl" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Wachtwoord</Label>
        <div className="relative">
          <Input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Minimaal 6 tekens" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="button" variant="ghost" size="icon" aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'} className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Business toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Ik registreer als bedrijf</p>
            <p className="text-xs text-muted-foreground">Krijg toegang tot het zakelijk dashboard</p>
          </div>
        </div>
        <Switch checked={isBusiness} onCheckedChange={setIsBusiness} />
      </div>

      {isBusiness && (
        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="space-y-2">
            <Label htmlFor="dealer-name">Bedrijfsnaam</Label>
            <Input id="dealer-name" placeholder="Uw bedrijfsnaam" value={dealerName} onChange={(e) => setDealerName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat-country">Land</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Land ondernemingsnummer">
              {(['BE', 'NL'] as VatCountry[]).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={vatCountry === c ? 'default' : 'outline'}
                  role="radio"
                  aria-checked={vatCountry === c}
                  onClick={() => setVatCountry(c)}
                >
                  {c === 'BE' ? 'België' : 'Nederland'}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat-number">Ondernemingsnummer / BTW-nummer</Label>
            <Input
              id="vat-number"
              placeholder={VAT_PATTERNS[vatCountry].placeholder}
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{VAT_PATTERNS[vatCountry].hint}</p>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Laden...' : 'Account aanmaken'}
      </Button>
    </form>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <SEOHead title="Inloggen - VATUUR." description="Log in of maak een account aan bij VATUUR." noindex />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Terug"
        onClick={handleBack}
        className="absolute top-4 left-4 focus-ring"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size="lg" asLink />
          </div>
          <CardTitle as="h1">Welkom</CardTitle>
          <CardDescription>Log in of maak een account aan</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Inloggen</TabsTrigger>
              <TabsTrigger value="signup">Registreren</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
