import { useState, useEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Upload, X, Sparkles, Loader2, ShieldCheck, AlertTriangle, Wrench, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
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
}

const steps = ['Basisgegevens', 'Details', "Foto's", 'Prijs & Beschrijving', 'Overzicht'];

export default function Sell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VehicleAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    brand: '', model: '', year: '', mileage: '', fuelType: '', transmission: '', 
    bodyType: '', color: '', power: '', price: '', description: '', city: '', province: '',
  });

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
    
    // Create previews
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
      // Upload images first
      const imageUrls = await uploadImages();
      
      // Create listing
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
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
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
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
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
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
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
            <div className="space-y-4">
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
            <div className="space-y-4">
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
