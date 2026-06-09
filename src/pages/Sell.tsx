import { useState, useEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Upload, X, Sparkles, Loader2, ShieldCheck, AlertTriangle, Wrench, Target, Euro, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CAR_BRANDS, FUEL_TYPES, TRANSMISSION_TYPES, BODY_TYPES } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

const steps = ['Basisgegevens', 'Details', "Foto's", 'Prijs & Beschrijving', 'Overzicht'];

export default function Sell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const initialStep = Math.min(parseInt(searchParams.get('step') || '0') || 0, 4);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VehicleAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSnapshot, setAnalysisSnapshot] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    brand: '', model: '', year: '', mileage: '', fuelType: '', transmission: '', 
    bodyType: '', color: '', power: '', price: '', description: '', city: '', province: '',
  });

  // Load existing draft when arriving from AutoWaarde
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
      setFormData({
        brand: data.brand || '',
        model: data.model || '',
        year: data.year ? String(data.year) : '',
        mileage: data.mileage ? String(data.mileage) : '',
        fuelType: data.fuel_type || '',
        transmission: data.transmission || '',
        bodyType: data.body_type || '',
        color: data.color || '',
        power: data.power ? String(data.power) : '',
        price: data.price ? String(data.price) : '',
        description: data.description || '',
        city: data.city || '',
        province: data.province || '',
      });
      if (data.images?.length) setImagePreviews(data.images);
    })();
  }, [draftId, user]);

  const updateForm = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));
  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (!formData.brand) return 'Selecteer een merk';
        if (!formData.model) return 'Vul het model in';
        if (!formData.year) return 'Vul het bouwjaar in';
        if (!formData.mileage) return 'Vul de kilometerstand in';
        return null;
      case 1:
        if (!formData.fuelType) return 'Selecteer het brandstoftype';
        if (!formData.transmission) return 'Selecteer de transmissie';
        if (!formData.bodyType) return 'Selecteer het carrosserietype';
        return null;
      case 3:
        if (!formData.price) return 'Vul de vraagprijs in';
        return null;
      default:
        return null;
    }
  };

  const nextStep = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast({ title: error, variant: 'destructive' });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const getAnalysisSignature = (data: typeof formData) => JSON.stringify({
    brand: data.brand, model: data.model, year: data.year, mileage: data.mileage,
    fuelType: data.fuelType, transmission: data.transmission, power: data.power,
    bodyType: data.bodyType, price: data.price,
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
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
            mileage: formData.mileage,
            fuelType: formData.fuelType,
            transmission: formData.transmission,
            power: formData.power,
            bodyType: formData.bodyType,
            price: formData.price || undefined,
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
    if (currentStep === 3 && !analysisResult && !analysisLoading) {
      fetchAnalysis();
    }
  }, [currentStep]);

  const applySuggestedPrice = () => {
    if (analysisResult?.suggestedPrice) {
      updateForm('price', String(analysisResult.suggestedPrice));
    }
  };

  const parseSellTimeScore = (estimatedTime: string): { score: number; speed: 'snel' | 'gemiddeld' | 'langzaam' } => {
    const text = estimatedTime.toLowerCase();
    
    // Parse days
    const daysMatch = text.match(/(\d+)-(\d+)\s*dag/);
    if (daysMatch) {
      const maxDays = parseInt(daysMatch[2]);
      return { score: 90, speed: 'snel' };
    }
    
    // Parse weeks
    const weeksMatch = text.match(/(\d+)-(\d+)\s*week/);
    if (weeksMatch) {
      const maxWeeks = parseInt(weeksMatch[2]);
      if (maxWeeks <= 2) return { score: 75, speed: 'snel' };
      if (maxWeeks <= 4) return { score: 50, speed: 'gemiddeld' };
      return { score: 25, speed: 'langzaam' };
    }
    
    // Parse months
    const monthsMatch = text.match(/(\d+)-(\d+)\s*maand/);
    if (monthsMatch) {
      const maxMonths = parseInt(monthsMatch[2]);
      if (maxMonths <= 1) return { score: 40, speed: 'gemiddeld' };
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
          color: formData.color, power: formData.power,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Genereren mislukt');
      }
      const { description } = await resp.json();
      updateForm('description', description);
      toast({ title: 'Beschrijving gegenereerd! ✨' });
    } catch (e) {
      console.error(e);
      toast({ title: e instanceof Error ? e.message : 'Er ging iets mis', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 10) {
      toast({ title: 'Maximaal 10 foto\'s', variant: 'destructive' });
      return;
    }
    
    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);
        urls.push(publicUrl);
      }
    }
    
    return urls;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const imageUrls = await uploadImages();
      
      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        title: `${formData.brand} ${formData.model}`,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        price: parseInt(formData.price),
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        body_type: formData.bodyType,
        color: formData.color,
        power: formData.power ? parseInt(formData.power) : null,
        description: formData.description,
        images: imageUrls,
        city: formData.city,
        province: formData.province,
        status: 'active',
      });

      if (error) throw error;

      toast({ title: 'Advertentie geplaatst!' });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <SEOHead
        title="Auto verkopen - VATUUR."
        description="Plaats gratis je advertentie en bereik duizenden kopers. Verkoop je auto snel en eenvoudig via VATUUR."
        canonical="https://vatuur.nl/verkopen"
      />
      <h1 className="text-2xl font-bold text-center">Auto verkopen</h1>

      {/* Progress */}
      <div className="mt-8 flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium',
              index < currentStep ? 'bg-success text-success-foreground' : index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && <div className={cn('ml-2 h-0.5 w-8 md:w-16', index < currentStep ? 'bg-success' : 'bg-muted')} />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center font-medium">{steps[currentStep]}</p>

      {/* Form Steps */}
      <Card className="mt-8">
        <CardContent className="p-6">
          {currentStep === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Merk *</Label>
                <Select value={formData.brand} onValueChange={(v) => updateForm('brand', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer merk" /></SelectTrigger>
                  <SelectContent>{CAR_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Model *</Label><Input value={formData.model} onChange={(e) => updateForm('model', e.target.value)} placeholder="Bijv. Golf" /></div>
              <div className="space-y-2"><Label>Bouwjaar *</Label><Input type="number" value={formData.year} onChange={(e) => updateForm('year', e.target.value)} placeholder="2020" /></div>
              <div className="space-y-2"><Label>Kilometerstand *</Label><Input type="number" value={formData.mileage} onChange={(e) => updateForm('mileage', e.target.value)} placeholder="50000" /></div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Brandstof *</Label>
                <Select value={formData.fuelType} onValueChange={(v) => updateForm('fuelType', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmissie *</Label>
                <Select value={formData.transmission} onValueChange={(v) => updateForm('transmission', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>{TRANSMISSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Carrosserie *</Label>
                <Select value={formData.bodyType} onValueChange={(v) => updateForm('bodyType', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>{BODY_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Kleur</Label><Input value={formData.color} onChange={(e) => updateForm('color', e.target.value)} placeholder="Zwart metallic" /></div>
              <div className="space-y-2"><Label>Vermogen (pk)</Label><Input type="number" value={formData.power} onChange={(e) => updateForm('power', e.target.value)} placeholder="150" /></div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-md bg-muted hover:bg-muted/80 transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Klik om foto's te uploaden (max 10)</p>
                </label>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-video">
                      <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -right-2 -top-2 rounded-md bg-destructive p-1 text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* AI Analyse - Prijsvoorstel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    VATUUR. AI Analyse
                  </h3>
                  {analysisResult && !analysisLoading && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={fetchAnalysis}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Vernieuwen
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
                      <RefreshCw className="h-3.5 w-3.5" />
                      Analyse opnieuw berekenen
                    </Button>
                  </div>
                )}

                {analysisLoading && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI analyseert je wagen...</p>
                  </div>
                )}

                {analysisError && (
                  <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                    {analysisError}
                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fetchAnalysis}>
                      Opnieuw proberen
                    </Button>
                  </div>
                )}

                {analysisResult && (
                  <div className={cn("space-y-4", isAnalysisStale && "opacity-60")}>
                    {/* Prijsvoorstel */}
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
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={applySuggestedPrice}>
                          <TrendingUp className="h-3.5 w-3.5" />
                          Gebruik dit prijsvoorstel
                        </Button>
                      </div>
                    )}

                    {/* Geschatte verkooptijd */}
                    {analysisResult.estimatedSellTime && (() => {
                      const { score, speed } = parseSellTimeScore(analysisResult.estimatedSellTime);
                      const speedColors = {
                        snel: 'text-green-600',
                        gemiddeld: 'text-amber-600',
                        langzaam: 'text-orange-600'
                      };
                      const speedBgColors = {
                        snel: '[&>div]:bg-green-500',
                        gemiddeld: '[&>div]:bg-amber-500',
                        langzaam: '[&>div]:bg-orange-500'
                      };
                      const speedLabelBg = {
                        snel: 'bg-green-50',
                        gemiddeld: 'bg-amber-50',
                        langzaam: 'bg-orange-50'
                      };
                      
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
                          <div className={`space-y-1.5 ${speedBgColors[speed]}`}>
                            <Progress value={score} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                              <span>Langzaam</span>
                              <span>Snel</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Betrouwbaarheid */}
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Betrouwbaarheid</p>
                        <p className="text-sm text-foreground/80 mt-1">{analysisResult.reliability}</p>
                      </div>
                    </div>

                    {/* Aandachtspunten */}
                    {analysisResult.commonIssues?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          Aandachtspunten
                        </p>
                        {analysisResult.commonIssues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-foreground/80">{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Onderhoud */}
                    <div className="flex items-start gap-3">
                      <Wrench className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Onderhoud</p>
                        <p className="text-sm text-foreground/80 mt-1">{analysisResult.maintenanceCost}</p>
                      </div>
                    </div>

                    {/* Geschikt voor */}
                    {analysisResult.suitability?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          Geschikt voor
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.suitability.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Samenvatting */}
                    <p className="text-sm text-foreground/80 italic">{analysisResult.verdict}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Prijs & beschrijving formulier */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Vraagprijs *</Label><Input type="number" value={formData.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="25000" /></div>
                <div className="space-y-2"><Label>Stad</Label><Input value={formData.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Amsterdam" /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Beschrijving</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="gap-1.5"
                  >
                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isGenerating ? 'Bezig...' : 'Genereer met AI'}
                  </Button>
                </div>
                <Textarea value={formData.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Beschrijf je auto..." rows={6} />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="font-semibold">Controleer je gegevens</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Auto</span><span className="font-medium">{formData.brand} {formData.model}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Bouwjaar</span><span className="font-medium">{formData.year}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Km-stand</span><span className="font-medium">{formData.mileage} km</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Brandstof</span><span className="font-medium">{formData.fuelType}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Transmissie</span><span className="font-medium">{formData.transmission}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Foto's</span><span className="font-medium">{imagePreviews.length} foto's</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Vraagprijs</span><span className="font-medium text-accent">€ {formData.price}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}><ChevronLeft className="mr-2 h-4 w-4" />Vorige</Button>
        {currentStep === steps.length - 1 ? (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSubmitting ? 'Bezig...' : 'Advertentie plaatsen'}
          </Button>
        ) : (
          <Button onClick={nextStep}>Volgende<ChevronRight className="ml-2 h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
