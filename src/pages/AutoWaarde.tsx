import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator, Car, Gauge, Calendar, BadgeCheck, BarChart3, ShieldCheck, Sparkles, ArrowRight,
  CheckCircle2, Star, Clock, TrendingUp, Mail, Loader2, Megaphone, LogIn,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAR_BRANDS, CAR_MODELS } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';
import { useMarketingEvents } from '@/hooks/useMarketingEvents';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { insertVehicleLead, createDraftListing, attachListingToLead, attachUserToLead } from '@/lib/vehicleLeads';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

const FUELS = ['benzine', 'diesel', 'elektrisch', 'hybride', 'plug-in hybride', 'lpg'];
const TRANSMISSIONS = ['handgeschakeld', 'automaat', 'semi-automaat'];

interface AiResult {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  priceExplanation: string;
  estimatedSellTime: string;
  verdict: string;
  reliability?: string;
  commonIssues?: string[];
}

function fallbackEstimate({ brand, year, mileage }: { brand: string; year: number; mileage: number }): AiResult {
  const premium = ['Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Tesla', 'Volvo'].includes(brand);
  const base = premium ? 32000 : 18000;
  const ageYears = Math.max(0, currentYear - year);
  const ageFactor = Math.pow(0.88, ageYears);
  const kmFactor = Math.max(0.35, 1 - mileage / 350000);
  const mid = Math.round(base * ageFactor * kmFactor);
  return {
    suggestedPrice: mid,
    priceRange: { min: Math.max(500, Math.round(mid * 0.85)), max: Math.round(mid * 1.15) },
    priceExplanation: 'Snelle schatting op basis van merksegment, ouderdom en km-stand.',
    estimatedSellTime: '4-8 weken',
    verdict: 'Indicatieve richtprijs — log in voor een diepere AI-analyse.',
  };
}

const formatEuro = (n: number) => `€ ${Math.max(0, Math.round(n)).toLocaleString('nl-BE')}`;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AutoWaarde() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useMarketingEvents('autowaarde');
  const { user } = useAuth();

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showInlineAuth, setShowInlineAuth] = useState(false);

  const availableModels = brand ? CAR_MODELS[brand] || [] : [];

  useEffect(() => {
    trackEvent('page_view');
  }, [trackEvent]);

  const buildPrefillQS = () => {
    const p = new URLSearchParams();
    if (brand) p.set('brand', brand);
    if (model) p.set('model', model);
    if (year) p.set('year', year);
    if (mileage) p.set('mileage', mileage);
    if (fuelType) p.set('fuelType', fuelType);
    if (transmission) p.set('transmission', transmission);
    if (result?.suggestedPrice) p.set('suggestedPrice', String(result.suggestedPrice));
    return p.toString();
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !year || !mileage) return;
    const stub = {
      title: `${brand} ${model || ''}`.trim(),
      brand, model: model || brand,
      year: parseInt(year),
      mileage: parseInt(mileage),
      fuelType: fuelType || 'benzine',
      transmission: transmission || 'handgeschakeld',
      bodyType: 'sedan',
      features: [] as string[],
      price: null as number | null,
    };
    setLoading(true);
    setResult(null);
    trackEvent('analysis_started', { payload: { brand, model, year, mileage } });
    try {
      const { data, error } = await supabase.functions.invoke('vehicle-analysis', {
        body: { listing: stub },
      });
      if (error || !data || data.error) throw new Error(error?.message || data?.error || 'AI');
      const ai: AiResult = {
        suggestedPrice: data.suggestedPrice || 0,
        priceRange: data.priceRange || { min: 0, max: 0 },
        priceExplanation: data.priceExplanation || '',
        estimatedSellTime: data.estimatedSellTime || '',
        verdict: data.verdict || '',
        reliability: data.reliability,
        commonIssues: data.commonIssues,
      };
      setResult(ai);
      trackEvent('analysis_completed', {
        payload: { brand, model, year, mileage, suggestedPrice: ai.suggestedPrice, source: 'ai' },
      });
      try {
        const id = await insertVehicleLead({
          brand, model, year: parseInt(year), mileage: parseInt(mileage),
          fuelType, transmission,
          estimatedPrice: ai.suggestedPrice,
          priceMin: ai.priceRange.min, priceMax: ai.priceRange.max,
        }, user?.id);
        setLeadId(id);
      } catch (err) { console.warn('lead insert failed', err); }
    } catch {
      const fb = fallbackEstimate({ brand, year: parseInt(year), mileage: parseInt(mileage) });
      setResult(fb);
      trackEvent('analysis_completed', {
        payload: { brand, model, year, mileage, suggestedPrice: fb.suggestedPrice, source: 'fallback' },
      });
      try {
        const id = await insertVehicleLead({
          brand, model, year: parseInt(year), mileage: parseInt(mileage),
          fuelType, transmission,
          estimatedPrice: fb.suggestedPrice,
          priceMin: fb.priceRange.min, priceMax: fb.priceRange.max,
        }, user?.id);
        setLeadId(id);
      } catch (err) { console.warn('lead insert failed', err); }
    } finally {
      setLoading(false);
      setTimeout(() => document.getElementById('resultaat')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const goToDraftWizard = async (uid: string) => {
    if (!result) return;
    const listingId = await createDraftListing(uid, {
      brand, model: model || brand,
      year: parseInt(year), mileage: parseInt(mileage),
      fuelType, transmission,
      suggestedPrice: result.suggestedPrice,
    });
    if (leadId) await attachListingToLead(leadId, listingId);
    trackEvent('ad_intent', { payload: { suggestedPrice: result.suggestedPrice, brand, model, draftId: listingId } });
    navigate(`/verkopen?draftId=${listingId}&step=2`);
  };

  const handlePublishClick = async () => {
    if (!result) return;
    if (user) {
      setPublishing(true);
      try { await goToDraftWizard(user.id); }
      catch (e) {
        console.error(e);
        toast({ title: 'Kon advertentie niet aanmaken', variant: 'destructive' });
      } finally { setPublishing(false); }
    } else {
      setShowInlineAuth(true);
      setTimeout(() => document.getElementById('inline-auth')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(authEmail) || authPassword.length < 6) {
      toast({ title: 'Vul een geldig e-mailadres en wachtwoord (≥6 tekens) in', variant: 'destructive' });
      return;
    }
    setPublishing(true);
    try {
      if (authMode === 'signup') {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: authEmail, password: authPassword,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: authEmail.split('@')[0] } },
        });
        if (signUpErr) throw signUpErr;
        let uid = signUpData.user?.id;
        if (!signUpData.session) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: authEmail, password: authPassword,
          });
          if (signInErr) {
            toast({ title: 'Bevestig je e-mail', description: 'Check je inbox om je account te activeren, en kom dan terug om je advertentie te publiceren.' });
            setPublishing(false);
            return;
          }
          uid = signInData.user?.id;
        }
        if (!uid) throw new Error('Geen gebruiker');
        trackEvent('account_intent', { email: authEmail, payload: { brand, model, suggestedPrice: result?.suggestedPrice } });
        if (leadId) await attachUserToLead(leadId, uid);
        await goToDraftWizard(uid);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        const uid = data.user?.id;
        if (!uid) throw new Error('Geen gebruiker');
        if (leadId) await attachUserToLead(leadId, uid);
        await goToDraftWizard(uid);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Aanmelden mislukt';
      toast({ title: msg, variant: 'destructive' });
      setPublishing(false);
    }
  };

  const handleAccountIntent = () => {
    trackEvent('account_intent', { payload: { suggestedPrice: result?.suggestedPrice, brand, model } });
    navigate(`/auth?intent=sell&${buildPrefillQS()}`);
  };

  const handleAdIntent = () => {
    trackEvent('ad_intent', { payload: { suggestedPrice: result?.suggestedPrice, brand, model } });
    navigate(`/verkopen?${buildPrefillQS()}`);
  };

  const handleSearchSimilar = () => {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (year) params.set('minYear', String(parseInt(year) - 1));
    navigate(`/zoeken?${params.toString()}`);
  };

  const handleSaveByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email)) {
      toast({ title: 'Ongeldig e-mailadres', description: 'Vul een geldig adres in.', variant: 'destructive' });
      return;
    }
    await trackEvent('retargeting_opt_in', {
      email,
      payload: { brand, model, year, mileage, suggestedPrice: result?.suggestedPrice },
    });
    setEmailSent(true);
    toast({ title: 'Bewaard!', description: 'We sturen je waardebepaling per e-mail.' });
  };

  const jsonLd = useMemo(() => ([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vatuur.be/' },
        { '@type': 'ListItem', position: 2, name: 'Wat is mijn auto waard?', item: 'https://vatuur.be/wat-is-mijn-auto-waard' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Gratis online autotaxatie',
      provider: { '@type': 'Organization', name: 'VATUUR.', url: 'https://vatuur.be' },
      areaServed: ['BE', 'NL'],
      description: 'AI-gestuurde gratis waardebepaling van je tweedehandswagen op basis van merk, model, bouwjaar en km-stand.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Hoe wordt de waarde van mijn auto bepaald?', acceptedAnswer: { '@type': 'Answer', text: 'Onze AI vergelijkt jouw wagen met duizenden actieve advertenties op basis van merk, model, bouwjaar, km-stand, brandstof en uitrusting.' } },
        { '@type': 'Question', name: 'Is de autowaardebepaling van Vatuur gratis?', acceptedAnswer: { '@type': 'Answer', text: 'Ja, de waardebepaling is volledig gratis en zonder registratie.' } },
        { '@type': 'Question', name: 'Hoe nauwkeurig is een online autotaxatie?', acceptedAnswer: { '@type': 'Answer', text: 'Een AI-taxatie geeft een betrouwbare richtprijs. Voor een exacte waarde blijft een fysieke inspectie aanbevolen.' } },
        { '@type': 'Question', name: 'Kan ik mijn auto ook meteen verkopen via Vatuur?', acceptedAnswer: { '@type': 'Answer', text: 'Ja, na de waardebepaling kan je in enkele stappen je gratis advertentie plaatsen.' } },
      ],
    },
  ]), []);

  const factors = [
    { icon: Car, title: 'Merk & model', text: 'Sommige merken behouden hun waarde beter dan andere.' },
    { icon: Calendar, title: 'Bouwjaar', text: 'Gemiddeld 10-15% waardeverlies per jaar.' },
    { icon: Gauge, title: 'Km-stand', text: 'Lage km-stand = hogere restwaarde.' },
    { icon: BadgeCheck, title: 'Staat & opties', text: 'Onderhoudshistoriek en uitrusting tellen mee.' },
    { icon: BarChart3, title: 'Live marktdata', text: 'Duizenden actieve advertenties.' },
  ];

  const trust = [
    { icon: BarChart3, title: 'Live marktdata', text: 'Schatting op basis van duizenden lopende advertenties in België en Nederland.' },
    { icon: ShieldCheck, title: 'Onafhankelijk', text: 'We zijn geen opkoper. Eerlijke richtprijs zonder verborgen agenda.' },
    { icon: Sparkles, title: 'AI-gestuurd', text: 'Vergelijkt jouw wagen direct met gelijkaardige modellen op de markt.' },
  ];

  const stats = [
    { value: '120k+', label: 'Actieve kopers/maand' },
    { value: '85k', label: 'Wagens verkocht' },
    { value: '4.8/5', label: 'Beoordeling' },
    { value: '< 5 wk', label: 'Gem. verkooptijd' },
  ];

  const testimonials = [
    { name: 'Liesbeth, Antwerpen', text: 'Op 10 minuten een eerlijke prijs én twee dagen later verkocht. Top!', car: 'Volkswagen Polo' },
    { name: 'Tom, Gent', text: 'De AI-schatting kwam bijna exact overeen met wat ik uiteindelijk kreeg.', car: 'Audi A3' },
    { name: 'Sofie, Hasselt', text: 'Gratis, snel en zonder gedoe. Veel beter dan een opkoper.', car: 'Renault Clio' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Wat is mijn auto waard? | Gratis AI-autotaxatie | VATUUR."
        description="Ontdek in 1 minuut gratis wat je wagen waard is met AI. Eerlijke richtprijs, range en verkooptijd. Direct verkopen via VATUUR."
        canonical="https://vatuur.be/wat-is-mijn-auto-waard"
        jsonLd={jsonLd}
      />

      {/* Hero met analyse-form */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container py-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Gratis · Geen registratie · AI-gedreven
              </div>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                Wat is mijn auto waard<span className="text-primary">?</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Ontdek in één minuut de eerlijke marktwaarde van je wagen met onze AI —
                en verkoop hem meteen aan duizenden kopers in de Benelux.
              </p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {['100% gratis', 'Geen opkoper', 'AI-schatting in seconden', 'Direct online verkopen'].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
                </div>
                <span className="text-sm text-muted-foreground">4.8/5 · 2.300+ taxaties deze maand</span>
              </div>
            </div>

            {/* Form */}
            <form id="waardetool" onSubmit={handleCalculate} className="rounded-2xl border border-border/60 bg-card p-6 md:p-7 shadow-floating">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Bereken nu je autowaarde</h2>
                <p className="text-xs text-muted-foreground">Geen registratie nodig — direct resultaat.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Merk</Label>
                  <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(''); }}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Kies merk" /></SelectTrigger>
                    <SelectContent className="bg-card max-h-72">
                      {CAR_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model</Label>
                  {availableModels.length ? (
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Kies model" /></SelectTrigger>
                      <SelectContent className="bg-card max-h-72">
                        {availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="mt-1 h-11" placeholder="Bv. Golf" value={model} onChange={(e) => setModel(e.target.value)} />
                  )}
                </div>
                <div>
                  <Label>Bouwjaar</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Kies jaar" /></SelectTrigger>
                    <SelectContent className="bg-card max-h-64">
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Km-stand</Label>
                  <Input type="number" min={0} placeholder="95000" value={mileage} onChange={(e) => setMileage(e.target.value)} className="mt-1 h-11" />
                </div>
                <div>
                  <Label>Brandstof <span className="text-muted-foreground">(optioneel)</span></Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Kies brandstof" /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {FUELS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Versnellingsbak <span className="text-muted-foreground">(optioneel)</span></Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Kies type" /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!brand || !year || !mileage || loading}
                className="mt-5 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> AI analyseert…</> : <><Calculator className="h-5 w-5" /> Bereken mijn waarde</>}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">100% gratis · Geen account nodig · 1 minuut</p>
            </form>
          </div>
        </div>
      </section>

      {/* Resultaat */}
      {(loading || result) && (
        <section id="resultaat" className="border-b border-border/60 bg-muted/30 py-10 md:py-14">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              {loading && (
                <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-floating animate-pulse">
                  <div className="h-4 w-40 bg-muted rounded mb-4" />
                  <div className="h-12 w-64 bg-muted rounded mb-6" />
                  <div className="h-2 w-full bg-muted rounded mb-3" />
                  <div className="grid gap-3 sm:grid-cols-3 mt-6">
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                </div>
              )}

              {!loading && result && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 md:p-8 shadow-floating animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
                    <Sparkles className="h-3.5 w-3.5" /> AI-waardebepaling
                  </div>
                  <p className="text-sm text-muted-foreground">Geschatte marktwaarde voor jouw {brand} {model}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Vanaf</p>
                      <p className="text-xl font-semibold">{formatEuro(result.priceRange.min)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Richtprijs</p>
                      <p className="text-3xl md:text-5xl font-bold text-primary">{formatEuro(result.suggestedPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tot</p>
                      <p className="text-xl font-semibold">{formatEuro(result.priceRange.max)}</p>
                    </div>
                  </div>

                  {/* Range bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div className="absolute top-0 h-full w-3 rounded-full bg-primary shadow-sm" style={{ left: '50%', transform: 'translateX(-50%)' }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatEuro(result.priceRange.min)}</span>
                      <span className="font-medium">richtprijs</span>
                      <span>{formatEuro(result.priceRange.max)}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {result.estimatedSellTime && (
                      <div className="flex items-start gap-2 rounded-lg bg-card/60 border border-border/40 p-3">
                        <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Verwachte verkooptijd</p>
                          <p className="text-sm font-semibold">{result.estimatedSellTime}</p>
                        </div>
                      </div>
                    )}
                    {result.reliability && (
                      <div className="flex items-start gap-2 rounded-lg bg-card/60 border border-border/40 p-3">
                        <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Betrouwbaarheid</p>
                          <p className="text-sm font-semibold">{result.reliability}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(result.priceExplanation || result.verdict) && (
                    <div className="mt-4 rounded-lg bg-card/60 border border-border/40 p-4">
                      <p className="text-sm leading-relaxed">{result.priceExplanation || result.verdict}</p>
                    </div>
                  )}

                  {/* Primary CTA — one click to publish */}
                  <div className="mt-6">
                    <Button
                      onClick={handlePublishClick}
                      size="lg"
                      disabled={publishing}
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
                    >
                      {publishing ? <><Loader2 className="h-5 w-5 animate-spin" /> Bezig…</> : <><Megaphone className="h-5 w-5" /> Plaats gratis advertentie <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {user ? 'Eén klik — je gegevens zijn al ingevuld, voeg enkel foto\'s toe.' : 'In 1 stap je account én advertentie aanmaken.'}
                    </p>
                  </div>

                  {/* Inline auth (only when not logged in & clicked CTA) */}
                  {!user && showInlineAuth && (
                    <form id="inline-auth" onSubmit={handleInlineAuth} className="mt-4 rounded-xl border border-primary/30 bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{authMode === 'signup' ? 'Maak je gratis account' : 'Log in'}</p>
                        <button
                          type="button"
                          onClick={() => setAuthMode(m => m === 'signup' ? 'signin' : 'signup')}
                          className="text-xs text-primary underline"
                        >
                          {authMode === 'signup' ? 'Ik heb al een account' : 'Nieuw account aanmaken'}
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input type="email" placeholder="E-mailadres" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="h-10" autoComplete="email" />
                        <Input type="password" placeholder="Wachtwoord (min. 6)" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="h-10" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} />
                      </div>
                      <Button type="submit" disabled={publishing} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        {publishing ? <><Loader2 className="h-4 w-4 animate-spin" /> Bezig…</> : <>{authMode === 'signup' ? <Megaphone className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} {authMode === 'signup' ? 'Account aanmaken & advertentie publiceren' : 'Inloggen & publiceren'}</>}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">100% gratis. Door verder te gaan ga je akkoord met onze voorwaarden.</p>
                    </form>
                  )}

                  <button onClick={handleSearchSimilar} className="mt-3 text-xs text-muted-foreground hover:text-foreground underline">
                    Of bekijk vergelijkbare wagens op de markt →
                  </button>


                  {/* Retargeting capture */}
                  <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-card/40 p-4">
                    {!emailSent ? (
                      <form onSubmit={handleSaveByEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> Bewaar deze waardebepaling per e-mail
                          </Label>
                          <Input type="email" placeholder="jouw@email.be" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10" />
                        </div>
                        <Button type="submit" variant="secondary" className="sm:w-auto">Verstuur</Button>
                      </form>
                    ) : (
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> We sturen je waardebepaling naar {email}.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="container py-10 md:py-14">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-stappen funnel */}
      <section className="border-y border-border/60 bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-2xl font-bold md:text-3xl">Van waardebepaling tot verkoop in 3 stappen</h2>
            <p className="mt-2 text-muted-foreground">Geen tussenpersoon, geen verborgen kosten.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { n: 1, title: 'Analyseer gratis', text: 'Vul merk, jaar en km-stand in en ontvang direct een AI-waardebepaling.' },
              { n: 2, title: 'Maak je account', text: 'In 30 seconden registreren. Je waardebepaling wordt automatisch bewaard.' },
              { n: 3, title: 'Verkoop snel', text: 'Plaats je advertentie en bereik duizenden kopers in België & Nederland.' },
            ].map(step => (
              <div key={step.n} className="rounded-xl border border-border/60 bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold mb-3">{step.n}</div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factoren */}
      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Hoe wordt jouw autowaarde bepaald?</h2>
          <p className="mt-3 text-muted-foreground">Vatuur combineert vijf factoren met live marktdata.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {factors.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-card p-5 shadow-card hover:shadow-floating transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/60 bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-2xl font-bold md:text-3xl">Verkocht via Vatuur</h2>
            <p className="mt-2 text-muted-foreground">Echte ervaringen van particuliere verkopers.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map(t => (
              <div key={t.name} className="rounded-xl border border-border/60 bg-card p-6">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
                </div>
                <p className="text-sm leading-relaxed">"{t.text}"</p>
                <p className="mt-4 text-xs text-muted-foreground"><strong className="text-foreground">{t.name}</strong> — {t.car}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold md:text-3xl">Waarom Vatuur betrouwbaar is</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {trust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 md:py-16 pb-28 lg:pb-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Klaar om je auto te verkopen?</h2>
            <p className="mt-3 text-muted-foreground">Plaats je advertentie in enkele minuten en bereik duizenden kopers.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={handleAccountIntent} size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                <UserPlus className="h-5 w-5" /> Maak gratis account
              </Button>
              <Button onClick={handleAdIntent} size="lg" variant="outline" className="border-border/60 gap-2">
                <Megaphone className="h-5 w-5" /> Direct verkopen <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
        <div className="mx-3 rounded-xl border border-border/60 bg-card/95 backdrop-blur p-3 shadow-floating">
          {result ? (
            <Button onClick={handleAccountIntent} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <UserPlus className="h-5 w-5" /> Maak gratis account
            </Button>
          ) : (
            <Button
              onClick={() => document.getElementById('waardetool')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              <Calculator className="h-5 w-5" /> Bereken mijn waarde
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
