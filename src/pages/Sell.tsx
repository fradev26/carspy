import { useState, useEffect, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Target,
  Euro,
  Clock,
  TrendingUp,
  RefreshCw,
  Edit3,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { FUEL_TYPES, TRANSMISSION_TYPES, BODY_TYPES } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BrandModelPicker } from '@/modules/sell/BrandModelPicker';
import { FeatureCheckboxGrid } from '@/modules/sell/FeatureCheckboxGrid';
import { PhotoUploader, type PhotoItem } from '@/modules/sell/PhotoUploader';
import {
  FEATURE_CATALOG,
  FEATURE_CATEGORY_ORDER,
  VEHICLE_INFO_ITEMS,
  flattenFeatures,
  type FeatureCategory,
} from '@/modules/sell/featureCatalog';

interface VehicleAnalysis {
  reliability: string;
  commonIssues: string[];
  maintenanceCost: string;
  suitability: string[];
  verdict: string;
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  priceExplanation: string;
  estimatedSellTime: string;
}

const STEP_LABELS = [
  'Basisgegevens',
  "Uitrusting & extra's",
  'Staat',
  "Foto's",
  'Verkoopinfo',
  'Contact',
];
const TOTAL_STEPS = STEP_LABELS.length;
const REVIEW_STEP = TOTAL_STEPS;

const BODY_FORM_OPTIONS = BODY_TYPES;
const MONTHS = [
  '01','02','03','04','05','06','07','08','09','10','11','12',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

type FeaturesState = Record<FeatureCategory | 'vehicle_information', string[]>;

interface FormState {
  // step 1
  brand: string;
  model: string;
  year: string;
  month: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  power: string;
  powerUnit: 'pk' | 'kW';
  modelVersion: string;
  mileage: string;
  // step 2
  features: FeaturesState;
  // step 3
  conditionOverall: 'excellent' | 'good' | 'fair' | 'repairs_needed' | '';
  damagePresent: 'yes' | 'no' | '';
  damageDescription: string;
  technicalPresent: 'yes' | 'no' | '';
  technicalDescription: string;
  // step 5
  price: string;
  priceNegotiable: 'yes' | 'no' | '';
  availableFrom: string;
  description: string;
  // step 6
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  confirmCorrect: boolean;
  acceptPrivacy: boolean;
}

const EMPTY_FEATURES: FeaturesState = {
  safety: [],
  comfort: [],
  multimedia: [],
  exterior: [],
  vehicle_information: [],
};

const EMPTY_FORM: FormState = {
  brand: '', model: '', year: '', month: '', bodyType: '', fuelType: '',
  transmission: '', power: '', powerUnit: 'pk', modelVersion: '', mileage: '',
  features: EMPTY_FEATURES,
  conditionOverall: '', damagePresent: '', damageDescription: '',
  technicalPresent: '', technicalDescription: '',
  price: '', priceNegotiable: '', availableFrom: '', description: '',
  name: '', email: '', phone: '', postalCode: '', city: '',
  confirmCorrect: false, acceptPrivacy: false,
};

export default function Sell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDealer, loading: profileLoading } = useProfile();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const dealerOverride = searchParams.get('dealer') === '1';
  const initialStep = Math.min(parseInt(searchParams.get('step') || '0') || 0, REVIEW_STEP);

  useEffect(() => {
    if (!profileLoading && user && isDealer && !dealerOverride) {
      navigate('/zakelijk', { replace: true });
    }
  }, [user, isDealer, profileLoading, navigate, dealerOverride]);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState<'kort' | 'uitgebreid' | 'verkoopgericht'>('uitgebreid');
  const [pendingAiText, setPendingAiText] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VehicleAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSnapshot, setAnalysisSnapshot] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  const autosaveKey = useMemo(() => (user ? `vatuur:sell-draft:${user.id}:${draftId ?? 'new'}` : null), [user, draftId]);

  // Autosave -> localStorage
  useEffect(() => {
    if (!autosaveKey) return;
    try {
      localStorage.setItem(autosaveKey, JSON.stringify(formData));
    } catch {}
  }, [autosaveKey, formData]);

  // Restore from localStorage when no draftId
  useEffect(() => {
    if (!autosaveKey || draftId) return;
    try {
      const raw = localStorage.getItem(autosaveKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setFormData((prev) => ({ ...prev, ...parsed, features: { ...EMPTY_FEATURES, ...(parsed.features ?? {}) } }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveKey]);

  // Load existing draft
  useEffect(() => {
    if (!draftId || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) return;
      const specs = (data.specs as Record<string, unknown> | null) ?? {};
      const featuresFromSpecs = (specs.vehicle_features as Partial<FeaturesState> | undefined) ?? {};
      const condition = (data.condition as Record<string, any> | null) ?? {};
      setFormData((prev) => ({
        ...prev,
        brand: data.brand || '',
        model: data.model || '',
        year: data.year ? String(data.year) : '',
        month: data.first_registration_date ? data.first_registration_date.slice(5, 7) : '',
        mileage: data.mileage ? String(data.mileage) : '',
        fuelType: data.fuel_type || '',
        transmission: data.transmission || '',
        bodyType: data.body_type || '',
        power: data.power ? String(data.power) : '',
        powerUnit: (data.power_unit === 'kW' ? 'kW' : 'pk') as 'pk' | 'kW',
        modelVersion: data.model_version || '',
        price: data.price ? String(data.price) : '',
        priceNegotiable: data.price_negotiable === true ? 'yes' : data.price_negotiable === false ? 'no' : '',
        description: data.description || '',
        city: data.city || '',
        features: { ...EMPTY_FEATURES, ...featuresFromSpecs },
        conditionOverall: (condition.overall as FormState['conditionOverall']) || '',
        damagePresent: condition.damage?.present === true ? 'yes' : condition.damage?.present === false ? 'no' : '',
        damageDescription: condition.damage?.description || '',
        technicalPresent: condition.technical?.present === true ? 'yes' : condition.technical?.present === false ? 'no' : '',
        technicalDescription: condition.technical?.description || '',
      }));
      if (data.images?.length) {
        setPhotos(data.images.map((url: string) => ({ preview: url })));
      }
    })();
  }, [draftId, user]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleFeature = (cat: FeatureCategory | 'vehicle_information', value: string) =>
    setFormData((prev) => {
      const current = prev.features[cat];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, features: { ...prev.features, [cat]: next } };
    });

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (!formData.brand) return 'Selecteer een merk';
        if (!formData.model) return 'Selecteer of vul het model in';
        if (!formData.year) return 'Selecteer het jaar van eerste registratie';
        if (!formData.bodyType) return 'Selecteer de carrosserievorm';
        if (!formData.fuelType) return 'Selecteer het brandstoftype';
        if (!formData.transmission) return 'Selecteer de transmissie';
        if (!formData.mileage) return 'Vul de kilometerstand in';
        return null;
      case 2:
        if (!formData.conditionOverall) return 'Geef de algemene staat aan';
        if (!formData.damagePresent) return 'Geef aan of er schade is';
        if (formData.damagePresent === 'yes' && !formData.damageDescription.trim()) return 'Omschrijf de schade';
        if (!formData.technicalPresent) return 'Geef aan of er technische problemen zijn';
        if (formData.technicalPresent === 'yes' && !formData.technicalDescription.trim()) return 'Omschrijf het technisch probleem';
        return null;
      case 4:
        if (!formData.price) return 'Vul een vraagprijs in';
        if (!formData.priceNegotiable) return 'Geef aan of de prijs onderhandelbaar is';
        return null;
      case 5:
        if (!formData.name.trim()) return 'Vul je naam in';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Vul een geldig e-mailadres in';
        if (!formData.phone.trim()) return 'Vul een telefoonnummer in';
        if (!formData.postalCode.trim()) return 'Vul de postcode in';
        if (!formData.city.trim()) return 'Vul de gemeente in';
        if (!formData.confirmCorrect || !formData.acceptPrivacy) return 'Bevestig beide checkboxen';
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      toast({ title: err, variant: 'destructive' });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, REVIEW_STEP));
  };
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // ---------- AI analyse (stap 5) ----------
  const getAnalysisSignature = (d: FormState) =>
    JSON.stringify({
      brand: d.brand, model: d.model, year: d.year, mileage: d.mileage,
      fuelType: d.fuelType, transmission: d.transmission, power: d.power,
      bodyType: d.bodyType, price: d.price,
    });

  const fetchAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    const signature = getAnalysisSignature(formData);
    try {
      const { data, error } = await supabase.functions.invoke('vehicle-analysis', {
        body: {
          listing: {
            title: `${formData.brand} ${formData.model}`,
            brand: formData.brand, model: formData.model, year: formData.year,
            mileage: formData.mileage, fuelType: formData.fuelType,
            transmission: formData.transmission, power: formData.power,
            bodyType: formData.bodyType, price: formData.price || undefined,
          },
        },
      });
      if (error) throw new Error(error.message);
      setAnalysisResult(data as VehicleAnalysis);
      setAnalysisSnapshot(signature);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Analyse niet beschikbaar');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const isAnalysisStale = Boolean(
    analysisResult && analysisSnapshot && analysisSnapshot !== getAnalysisSignature(formData)
  );

  useEffect(() => {
    if (currentStep === 4 && !analysisResult && !analysisLoading && formData.brand && formData.model) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const parseSellTimeScore = (estimatedTime: string): { score: number; speed: 'snel' | 'gemiddeld' | 'langzaam' } => {
    const text = estimatedTime.toLowerCase();
    if (/dag/.test(text)) return { score: 90, speed: 'snel' };
    const weeks = text.match(/(\d+)-(\d+)\s*week/);
    if (weeks) {
      const max = parseInt(weeks[2]);
      if (max <= 2) return { score: 75, speed: 'snel' };
      if (max <= 4) return { score: 50, speed: 'gemiddeld' };
      return { score: 25, speed: 'langzaam' };
    }
    const months = text.match(/(\d+)-(\d+)\s*maand/);
    if (months) {
      const max = parseInt(months[2]);
      if (max <= 1) return { score: 40, speed: 'gemiddeld' };
      return { score: 15, speed: 'langzaam' };
    }
    return { score: 50, speed: 'gemiddeld' };
  };

  const generateDescription = async () => {
    if (!formData.brand || !formData.model) {
      toast({ title: 'Vul eerst merk en model in', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          brand: formData.brand, model: formData.model, year: formData.year,
          mileage: formData.mileage, fuelType: formData.fuelType,
          transmission: formData.transmission, bodyType: formData.bodyType,
          power: formData.power, tone: aiTone,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Genereren mislukt');
      }
      const { description } = await resp.json();
      if (formData.description.trim().length > 0) {
        setPendingAiText(description);
      } else {
        update('description', description);
        toast({ title: 'Beschrijving gegenereerd' });
      }
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Er ging iets mis', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const QUICK_SNIPPETS = [
    { label: '+ APK / keuring', text: 'Recent gekeurd, APK / autokeuring in orde.' },
    { label: '+ Onderhoudshistorie', text: 'Volledige onderhoudshistorie aanwezig, altijd op tijd in onderhoud geweest.' },
    { label: '+ Niet-roker', text: 'Niet-roker, interieur in nette staat.' },
    { label: '+ Eerste eigenaar', text: 'Eerste eigenaar, altijd zorgvuldig gebruikt.' },
  ];

  const appendSnippet = (text: string) => {
    const current = formData.description.trim();
    const next = current ? `${current}\n${text}` : text;
    update('description', next);
  };


  // ---------- Upload + submit ----------
  const uploadNewPhotos = async (): Promise<string[]> => {
    const existing = photos.filter((p) => !p.file).map((p) => p.preview);
    const toUpload = photos.filter((p) => p.file);
    const uploaded: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      if (!p.file) {
        uploaded.push(p.preview);
        continue;
      }
      const ext = p.file.name.split('.').pop() || 'jpg';
      const name = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(name, p.file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(name);
        uploaded.push(publicUrl);
      }
    }
    void existing;
    return uploaded;
  };

  const buildPayload = (status: 'active' | 'draft', imageUrls: string[]) => {
    const powerKW = formData.power
      ? formData.powerUnit === 'kW'
        ? parseInt(formData.power)
        : Math.round(parseInt(formData.power) * 0.7355)
      : null;
    const firstReg = formData.year && formData.month ? `${formData.year}-${formData.month}-01` : null;
    return {
      user_id: user!.id,
      title: `${formData.brand} ${formData.model}`.trim(),
      brand: formData.brand,
      model: formData.model,
      model_version: formData.modelVersion || null,
      year: formData.year ? parseInt(formData.year) : 0,
      mileage: formData.mileage ? parseInt(formData.mileage) : 0,
      price: formData.price ? parseInt(formData.price) : 0,
      price_public: formData.price ? parseInt(formData.price) : null,
      price_negotiable: formData.priceNegotiable === 'yes' ? true : formData.priceNegotiable === 'no' ? false : null,
      fuel_type: formData.fuelType,
      transmission: formData.transmission,
      body_type: formData.bodyType,
      power: powerKW,
      power_unit: 'kW',
      first_registration_date: firstReg,
      condition_type: formData.conditionOverall || null,
      description: formData.description || null,
      images: imageUrls,
      city: formData.city,
      equipment: flattenFeatures(formData.features),
      condition: {
        overall: formData.conditionOverall,
        damage: {
          present: formData.damagePresent === 'yes',
          description: formData.damagePresent === 'yes' ? formData.damageDescription : null,
        },
        technical: {
          present: formData.technicalPresent === 'yes',
          description: formData.technicalPresent === 'yes' ? formData.technicalDescription : null,
        },
      },
      availability: formData.availableFrom ? { available_from: formData.availableFrom } : null,
      specs: {
        vehicle_features: formData.features,
        power_input: { value: formData.power, unit: formData.powerUnit },
        contact: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          postal_code: formData.postalCode,
        },
        ...(analysisResult?.suggestedPrice ? { estimated_market_value: analysisResult.suggestedPrice } : {}),
      },
      status,
    };
  };

  const saveDraft = async () => {
    if (!user) return;
    setIsSavingDraft(true);
    try {
      const imageUrls = photos.filter((p) => !p.file).map((p) => p.preview);
      const payload = buildPayload('draft', imageUrls);
      if (draftId) {
        await supabase.from('listings').update(payload).eq('id', draftId).eq('user_id', user.id);
      } else {
        await supabase.from('listings').insert(payload);
      }
      toast({ title: 'Concept opgeslagen' });
    } catch {
      toast({ title: 'Concept opslaan mislukt', variant: 'destructive' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const imageUrls = await uploadNewPhotos();
      const payload = buildPayload('active', imageUrls);
      const { error } = draftId
        ? await supabase.from('listings').update(payload).eq('id', draftId).eq('user_id', user.id)
        : await supabase.from('listings').insert(payload);
      if (error) throw error;
      if (autosaveKey) localStorage.removeItem(autosaveKey);
      toast({ title: 'Advertentie geplaatst!' });
      navigate('/dashboard');
    } catch (e: any) {
      console.error('Sell submit failed:', e);
      const msg = e?.message || e?.error_description || 'Er ging iets mis';
      toast({ title: 'Plaatsen mislukt', description: msg, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  const progress = Math.round(((currentStep + (currentStep === REVIEW_STEP ? 0 : 0)) / TOTAL_STEPS) * 100);
  const displayStep = Math.min(currentStep + 1, TOTAL_STEPS);

  return (
    <div className="container max-w-3xl py-8">
      <SEOHead
        title="Auto verkopen - VATUUR."
        description="Plaats gratis je advertentie en bereik duizenden kopers. Verkoop je auto snel en eenvoudig via VATUUR."
        canonical="https://vatuur.be/verkopen"
      />
      <h1 className="text-2xl font-bold text-center">Auto verkopen</h1>

      {/* Progress */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {currentStep === REVIEW_STEP ? 'Overzicht' : `Stap ${displayStep} van ${TOTAL_STEPS}`}
          </span>
          <span className="text-muted-foreground">
            {currentStep === REVIEW_STEP ? 'Controleer je advertentie' : STEP_LABELS[currentStep]}
          </span>
        </div>
        <Progress value={currentStep === REVIEW_STEP ? 100 : progress} className="h-2" />
        <div className="hidden sm:flex items-center justify-between">
          {STEP_LABELS.map((label, index) => (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium',
                  index < currentStep
                    ? 'bg-success text-success-foreground'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6 space-y-6">
          {/* STEP 1 — Basisgegevens */}
          {currentStep === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <BrandModelPicker
                brand={formData.brand}
                model={formData.model}
                onBrandChange={(v) => update('brand', v)}
                onModelChange={(v) => update('model', v)}
              />
              <div className="space-y-2">
                <Label htmlFor="sell-year">Jaar eerste registratie *</Label>
                <Select value={formData.year} onValueChange={(v) => update('year', v)}>
                  <SelectTrigger id="sell-year"><SelectValue placeholder="Selecteer jaar" /></SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-month">Maand</Label>
                <Select value={formData.month} onValueChange={(v) => update('month', v)}>
                  <SelectTrigger id="sell-month"><SelectValue placeholder="Selecteer maand" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-bodyType">Carrosserievorm *</Label>
                <Select value={formData.bodyType} onValueChange={(v) => update('bodyType', v)}>
                  <SelectTrigger id="sell-bodyType"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>
                    {BODY_FORM_OPTIONS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-fuelType">Brandstof *</Label>
                <Select value={formData.fuelType} onValueChange={(v) => update('fuelType', v)}>
                  <SelectTrigger id="sell-fuelType"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-transmission">Transmissie *</Label>
                <Select value={formData.transmission} onValueChange={(v) => update('transmission', v)}>
                  <SelectTrigger id="sell-transmission"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-power">Vermogen</Label>
                <div className="flex gap-2">
                  <Input
                    id="sell-power"
                    type="number"
                    value={formData.power}
                    onChange={(e) => update('power', e.target.value)}
                    placeholder="150"
                  />
                  <Select value={formData.powerUnit} onValueChange={(v) => update('powerUnit', v as 'pk' | 'kW')}>
                    <SelectTrigger className="w-24" aria-label="Eenheid vermogen"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pk">pk</SelectItem>
                      <SelectItem value="kW">kW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-modelVersion">Uitvoering / versie</Label>
                <Input
                  id="sell-modelVersion"
                  value={formData.modelVersion}
                  onChange={(e) => update('modelVersion', e.target.value)}
                  placeholder="Bijv. 2.0 TDI Highline"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sell-mileage">Kilometerstand *</Label>
                <Input
                  id="sell-mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => update('mileage', e.target.value)}
                  placeholder="50000"
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Uitrusting */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <section className="space-y-3" aria-labelledby="sell-feat-veh-info">
                <h3 id="sell-feat-veh-info" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Voertuiginformatie</h3>
                <FeatureCheckboxGrid
                  items={VEHICLE_INFO_ITEMS}
                  selected={formData.features.vehicle_information}
                  onToggle={(v) => toggleFeature('vehicle_information', v)}
                  groupLabel="Voertuiginformatie"
                />
              </section>
              {FEATURE_CATEGORY_ORDER.map((cat) => {
                const headingId = `sell-feat-${cat}`;
                return (
                  <section key={cat} className="space-y-3" aria-labelledby={headingId}>
                    <h3 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {FEATURE_CATALOG[cat].title}
                    </h3>
                    <FeatureCheckboxGrid
                      items={FEATURE_CATALOG[cat].items}
                      selected={formData.features[cat]}
                      onToggle={(v) => toggleFeature(cat, v)}
                      groupLabel={FEATURE_CATALOG[cat].title}
                    />
                  </section>
                );
              })}
            </div>
          )}

          {/* STEP 3 — Staat */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <section className="space-y-3" aria-labelledby="sell-cond-label">
                <Label id="sell-cond-label">Algemene staat *</Label>
                <RadioGroup
                  value={formData.conditionOverall}
                  onValueChange={(v) => update('conditionOverall', v as FormState['conditionOverall'])}
                  className="grid gap-2 sm:grid-cols-2"
                  aria-labelledby="sell-cond-label"
                  aria-required="true"
                >
                  {[
                    { v: 'excellent', l: 'Uitstekend' },
                    { v: 'good', l: 'Goed' },
                    { v: 'fair', l: 'Redelijk' },
                    { v: 'repairs_needed', l: 'Herstellingen nodig' },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      htmlFor={`cond-${opt.v}`}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors min-h-[48px]',
                        formData.conditionOverall === opt.v
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/60 hover:bg-muted/40'
                      )}
                    >
                      <RadioGroupItem value={opt.v} id={`cond-${opt.v}`} />
                      <span className="text-sm font-medium">{opt.l}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              <YesNoBlock
                idPrefix="damage"
                label="Schade aanwezig? *"
                value={formData.damagePresent}
                onChange={(v) => update('damagePresent', v)}
                detailLabel="Beschrijving schade"
                detailValue={formData.damageDescription}
                onDetailChange={(v) => update('damageDescription', v)}
              />

              <YesNoBlock
                idPrefix="tech"
                label="Technische problemen? *"
                value={formData.technicalPresent}
                onChange={(v) => update('technicalPresent', v)}
                detailLabel="Beschrijving probleem"
                detailValue={formData.technicalDescription}
                onDetailChange={(v) => update('technicalDescription', v)}
              />
            </div>
          )}

          {/* STEP 4 — Foto's */}
          {currentStep === 3 && <PhotoUploader photos={photos} onChange={setPhotos} />}

          {/* STEP 5 — Verkoopinfo */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* AI Analyse */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    VATUUR. AI Analyse
                  </h3>
                  {analysisResult && !analysisLoading && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={fetchAnalysis}>
                      <RefreshCw className="h-3.5 w-3.5" /> Vernieuwen
                    </Button>
                  )}
                </div>

                {isAnalysisStale && !analysisLoading && (
                  <div className="rounded-lg bg-warning/10 border border-warning/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">Analyse verouderd</p>
                        <p className="text-xs text-muted-foreground">De voertuiggegevens zijn gewijzigd sinds de laatste berekening.</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full gap-1.5" onClick={fetchAnalysis}>
                      <RefreshCw className="h-3.5 w-3.5" /> Analyse opnieuw berekenen
                    </Button>
                  </div>
                )}

                {analysisLoading && (
                  <div
                    className="flex flex-col items-center gap-3 py-8"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">AI analyseert je wagen...</p>
                  </div>
                )}

                {analysisError && (
                  <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                    {analysisError}
                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fetchAnalysis}>
                      Opnieuw proberen
                    </Button>
                  </div>
                )}

                {analysisResult && (
                  <div className={cn('space-y-4', isAnalysisStale && 'opacity-60')}>
                    {analysisResult.suggestedPrice > 0 && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Euro className="h-5 w-5 text-primary" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prijsvoorstel</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">€ {analysisResult.suggestedPrice.toLocaleString('nl-BE')}</span>
                        </div>
                        {analysisResult.priceRange && (
                          <p className="text-xs text-muted-foreground">
                            Prijsrange: € {analysisResult.priceRange.min?.toLocaleString('nl-BE')} – € {analysisResult.priceRange.max?.toLocaleString('nl-BE')}
                          </p>
                        )}
                        {analysisResult.priceExplanation && (
                          <p className="text-sm text-foreground/80">{analysisResult.priceExplanation}</p>
                        )}
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => update('price', String(analysisResult.suggestedPrice))}>
                          <TrendingUp className="h-3.5 w-3.5" /> Gebruik dit prijsvoorstel
                        </Button>
                      </div>
                    )}

                    {analysisResult.estimatedSellTime && (() => {
                      const { score, speed } = parseSellTimeScore(analysisResult.estimatedSellTime);
                      const speedColors = { snel: 'text-green-600', gemiddeld: 'text-amber-600', langzaam: 'text-orange-600' } as const;
                      const speedBgColors = { snel: '[&>div]:bg-green-500', gemiddeld: '[&>div]:bg-amber-500', langzaam: '[&>div]:bg-orange-500' } as const;
                      return (
                        <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-accent shrink-0" />
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geschatte verkooptijd</p>
                            </div>
                            <Badge variant="outline" className={`${speedBgColors[speed]} ${speedColors[speed]} border-current`}>
                              {speed.charAt(0).toUpperCase() + speed.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/80">{analysisResult.estimatedSellTime}</p>
                          <Progress value={score} className={`h-2 ${speedBgColors[speed]}`} />
                        </div>
                      );
                    })()}

                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Betrouwbaarheid</p>
                        <p className="text-sm text-foreground/80 mt-1">{analysisResult.reliability}</p>
                      </div>
                    </div>

                    {analysisResult.commonIssues?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Aandachtspunten
                        </p>
                        {analysisResult.commonIssues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-foreground/80">{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Wrench className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Onderhoud</p>
                        <p className="text-sm text-foreground/80 mt-1">{analysisResult.maintenanceCost}</p>
                      </div>
                    </div>

                    {analysisResult.suitability?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" /> Geschikt voor
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.suitability.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />
                    <p className="text-sm text-foreground/80 italic">{analysisResult.verdict}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sell-price">Vraagprijs (€) *</Label>
                  <Input
                    id="sell-price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={formData.price}
                    onChange={(e) => update('price', e.target.value)}
                    placeholder="25000"
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label id="sell-neg-label">Onderhandelbaar? *</Label>
                  <RadioGroup
                    value={formData.priceNegotiable}
                    onValueChange={(v) => update('priceNegotiable', v as 'yes' | 'no')}
                    className="flex gap-3 pt-1"
                    aria-labelledby="sell-neg-label"
                    aria-required="true"
                  >
                    <label htmlFor="neg-yes" className="flex items-center gap-2 text-sm min-h-[44px] cursor-pointer">
                      <RadioGroupItem value="yes" id="neg-yes" /> Ja
                    </label>
                    <label htmlFor="neg-no" className="flex items-center gap-2 text-sm min-h-[44px] cursor-pointer">
                      <RadioGroupItem value="no" id="neg-no" /> Nee
                    </label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sell-availableFrom">Beschikbaar vanaf</Label>
                  <Input
                    id="sell-availableFrom"
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => update('availableFrom', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="sell-description" className="text-base">Verkooptekst</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Vertel wat jouw auto bijzonder maakt — onderhoud, opties, reden van verkoop.</p>
                </div>

                {/* Quick snippets */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => appendSnippet(s.text)}
                      className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* AI toolbar */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                  <span className="text-xs font-medium text-muted-foreground px-1">AI-toon:</span>
                  <div className="flex rounded-md border border-border/60 bg-background overflow-hidden text-xs">
                    {(['kort', 'uitgebreid', 'verkoopgericht'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAiTone(t)}
                        className={cn(
                          'px-2.5 py-1 capitalize transition-colors',
                          aiTone === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    {formData.description.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => update('description', '')}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Wissen
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={isGenerating}
                      className="h-8 gap-1.5"
                    >
                      {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {isGenerating ? 'Bezig...' : 'Genereer met AI'}
                    </Button>
                  </div>
                </div>

                <Textarea
                  id="sell-description"
                  value={formData.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Bijv. tweede eigenaar, altijd in onderhoud bij dealer, nieuwe banden in 2024..."
                  rows={8}
                  maxLength={1500}
                  className="min-h-48 resize-y"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tip: vermeld onderhoud, accessoires en reden van verkoop voor sneller resultaat.</span>
                  <span className={cn(
                    'tabular-nums',
                    formData.description.length > 1300 ? 'text-warning font-medium' : 'text-muted-foreground',
                  )}>
                    {formData.description.length} / 1500
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 6 — Contact */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="sell-name">Naam *</Label><Input id="sell-name" autoComplete="name" value={formData.name} onChange={(e) => update('name', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="sell-email">E-mail *</Label><Input id="sell-email" type="email" autoComplete="email" value={formData.email} onChange={(e) => update('email', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="sell-phone">Telefoon *</Label><Input id="sell-phone" type="tel" autoComplete="tel" value={formData.phone} onChange={(e) => update('phone', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="sell-postalCode">Postcode *</Label><Input id="sell-postalCode" autoComplete="postal-code" value={formData.postalCode} onChange={(e) => update('postalCode', e.target.value)} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="sell-city">Gemeente *</Label><Input id="sell-city" autoComplete="address-level2" value={formData.city} onChange={(e) => update('city', e.target.value)} /></div>
              </div>
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <Checkbox checked={formData.confirmCorrect} onCheckedChange={(v) => update('confirmCorrect', Boolean(v))} className="mt-0.5" />
                  <span>Ik bevestig dat bovenstaande gegevens correct zijn.</span>
                </label>
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <Checkbox checked={formData.acceptPrivacy} onCheckedChange={(v) => update('acceptPrivacy', Boolean(v))} className="mt-0.5" />
                  <span>Ik ga akkoord met de <a href="/privacy" className="text-primary underline">privacyvoorwaarden</a>.</span>
                </label>
              </div>
            </div>
          )}

          {/* REVIEW */}
          {currentStep === REVIEW_STEP && (
            <SummaryReview
              data={formData}
              photos={photos}
              onEdit={(step) => setCurrentStep(step)}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={goPrev} disabled={currentStep === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Vorige
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={saveDraft} disabled={isSavingDraft || !user}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSavingDraft ? 'Bezig...' : 'Concept opslaan'}
          </Button>
          {currentStep === REVIEW_STEP ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? 'Bezig...' : 'Definitief verzenden'}
            </Button>
          ) : (
            <Button onClick={goNext}>
              {currentStep === TOTAL_STEPS - 1 ? 'Naar overzicht' : 'Volgende'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* AI overwrite confirmation */}
      <AlertDialog open={pendingAiText !== null} onOpenChange={(o) => { if (!o) setPendingAiText(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestaande tekst vervangen?</AlertDialogTitle>
            <AlertDialogDescription>
              Je hebt al een verkooptekst geschreven. Wat wil je doen met de AI-tekst?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingAiText) update('description', `${formData.description.trim()}\n\n${pendingAiText}`);
                setPendingAiText(null);
                toast({ title: 'Tekst toegevoegd' });
              }}
            >
              Toevoegen aan einde
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (pendingAiText) update('description', pendingAiText);
                setPendingAiText(null);
                toast({ title: 'Beschrijving vervangen' });
              }}
            >
              Vervangen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function YesNoBlock({
  idPrefix,
  label,
  value,
  onChange,
  detailLabel,
  detailValue,
  onDetailChange,
}: {
  idPrefix: string;
  label: string;
  value: 'yes' | 'no' | '';
  onChange: (v: 'yes' | 'no') => void;
  detailLabel: string;
  detailValue: string;
  onDetailChange: (v: string) => void;
}) {
  const labelId = `${idPrefix}-label`;
  const detailId = `${idPrefix}-detail`;
  return (
    <section className="space-y-3" aria-labelledby={labelId}>
      <Label id={labelId}>{label}</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as 'yes' | 'no')}
        className="flex gap-3"
        aria-labelledby={labelId}
        aria-required="true"
      >
        {(['yes', 'no'] as const).map((opt) => {
          const optId = `${idPrefix}-${opt}`;
          return (
            <label
              key={opt}
              htmlFor={optId}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm cursor-pointer min-h-[44px]',
                value === opt ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:bg-muted/40'
              )}
            >
              <RadioGroupItem value={opt} id={optId} />
              {opt === 'yes' ? 'Ja' : 'Nee'}
            </label>
          );
        })}
      </RadioGroup>
      {value === 'yes' && (
        <div className="space-y-2">
          <Label htmlFor={detailId} className="text-sm text-muted-foreground">{detailLabel}</Label>
          <Textarea id={detailId} value={detailValue} onChange={(e) => onDetailChange(e.target.value)} rows={3} />
        </div>
      )}
    </section>
  );
}

function SummaryReview({
  data,
  photos,
  onEdit,
}: {
  data: FormState;
  photos: PhotoItem[];
  onEdit: (step: number) => void;
}) {
  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <Button variant="ghost" size="sm" onClick={() => onEdit(step)}>
          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Bewerken
        </Button>
      </div>
      <div className="mt-3 space-y-1 text-sm">{children}</div>
    </div>
  );

  const row = (label: string, value: string | number | null | undefined) =>
    value ? (
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right break-anywhere">{value}</span>
      </div>
    ) : null;

  const featuresCount = Object.values(data.features).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Controleer je advertentie</h3>

      <Section title="Voertuig" step={0}>
        {row('Auto', `${data.brand} ${data.model} ${data.modelVersion}`.trim())}
        {row('Eerste registratie', data.year ? `${data.month ? data.month + '/' : ''}${data.year}` : null)}
        {row('Carrosserie', data.bodyType)}
        {row('Brandstof', data.fuelType)}
        {row('Transmissie', data.transmission)}
        {row('Vermogen', data.power ? `${data.power} ${data.powerUnit}` : null)}
        {row('Kilometerstand', data.mileage ? `${parseInt(data.mileage).toLocaleString('nl-BE')} km` : null)}
      </Section>

      <Section title="Uitrusting & extra's" step={1}>
        <p className="text-muted-foreground">{featuresCount} opties geselecteerd</p>
      </Section>

      <Section title="Staat" step={2}>
        {row('Algemeen', data.conditionOverall)}
        {row('Schade', data.damagePresent === 'yes' ? 'Ja' : data.damagePresent === 'no' ? 'Nee' : null)}
        {data.damagePresent === 'yes' && row('Beschrijving', data.damageDescription)}
        {row('Technische problemen', data.technicalPresent === 'yes' ? 'Ja' : data.technicalPresent === 'no' ? 'Nee' : null)}
        {data.technicalPresent === 'yes' && row('Beschrijving', data.technicalDescription)}
      </Section>

      <Section title="Foto's" step={3}>
        {photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, 8).map((p, i) => (
              <img key={i} src={p.preview} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Geen foto's geüpload</p>
        )}
      </Section>

      <Section title="Verkoopinformatie" step={4}>
        {row('Vraagprijs', data.price ? `€ ${parseInt(data.price).toLocaleString('nl-BE')}` : null)}
        {row('Onderhandelbaar', data.priceNegotiable === 'yes' ? 'Ja' : data.priceNegotiable === 'no' ? 'Nee' : null)}
        {row('Beschikbaar vanaf', data.availableFrom)}
      </Section>

      <Section title="Contactgegevens" step={5}>
        {row('Naam', data.name)}
        {row('E-mail', data.email)}
        {row('Telefoon', data.phone)}
        {row('Postcode', data.postalCode)}
        {row('Gemeente', data.city)}
      </Section>
    </div>
  );
}
