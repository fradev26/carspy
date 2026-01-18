import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CAR_BRANDS, FUEL_TYPES, TRANSMISSION_TYPES, BODY_TYPES } from '@/types/listing';
import { cn } from '@/lib/utils';

const steps = ['Basisgegevens', 'Details', "Foto's", 'Prijs & Beschrijving', 'Overzicht'];

export default function Sell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    brand: '', model: '', year: '', mileage: '', fuelType: '', transmission: '', bodyType: '', color: '', price: '', description: '',
  });

  const updateForm = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="container max-w-3xl py-8">
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
                <Label>Brandstof</Label>
                <Select value={formData.fuelType} onValueChange={(v) => updateForm('fuelType', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmissie</Label>
                <Select value={formData.transmission} onValueChange={(v) => updateForm('transmission', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>{TRANSMISSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Carrosserie</Label>
                <Select value={formData.bodyType} onValueChange={(v) => updateForm('bodyType', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>{BODY_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Kleur</Label><Input value={formData.color} onChange={(e) => updateForm('color', e.target.value)} placeholder="Zwart metallic" /></div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center py-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="mt-4 text-muted-foreground">Foto upload wordt beschikbaar met backend integratie</p>
              <Button variant="outline" className="mt-4">Selecteer foto's</Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Vraagprijs *</Label><Input type="number" value={formData.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="25000" /></div>
              <div className="space-y-2"><Label>Beschrijving</Label><Textarea value={formData.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Beschrijf je auto..." rows={6} /></div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Controleer je gegevens</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Auto</span><span className="font-medium">{formData.brand} {formData.model}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Bouwjaar</span><span className="font-medium">{formData.year}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Km-stand</span><span className="font-medium">{formData.mileage} km</span></div>
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
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Advertentie plaatsen</Button>
        ) : (
          <Button onClick={nextStep}>Volgende<ChevronRight className="ml-2 h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
