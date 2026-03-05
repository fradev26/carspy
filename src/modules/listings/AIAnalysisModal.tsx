import { useState } from 'react';
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';

interface AIAnalysisModalProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AnalysisResult {
  summary: string;
  details: string;
  tips: string[];
}

function computeMarketAnalysis(listing: Listing) {
  const basePrice = listing.price;
  const yearFactor = (listing.year - 2015) * 800;
  const mileageFactor = (200000 - listing.mileage) * 0.02;
  const avg = Math.round(basePrice * 0.95 + yearFactor + mileageFactor);
  const min = Math.round(avg * 0.82);
  const max = Math.round(avg * 1.18);
  const diff = ((listing.price - avg) / avg) * 100;
  const rating = diff < -5 ? 'good' : diff > 5 ? 'high' : 'fair';
  return { averagePrice: avg, minPrice: min, maxPrice: max, comparableCount: 12 + Math.floor(Math.random() * 20), rating };
}

export function AIAnalysisModal({ listing, open, onOpenChange }: AIAnalysisModalProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (result) return;
    setLoading(true);
    setError(null);
    try {
      const analysis = computeMarketAnalysis(listing);
      const payload = {
        listing: {
          title: listing.title,
          year: listing.year,
          mileage: listing.mileage,
          fuelType: listing.fuelType,
          transmission: listing.transmission,
          power: listing.power,
          features: listing.features,
          price: listing.price,
        },
        analysis,
      };
      const { data, error: fnError } = await supabase.functions.invoke('price-analysis', { body: payload });
      if (fnError) throw new Error(fnError.message);
      setResult(data as AnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse niet beschikbaar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (v && !result && !loading) fetchAnalysis();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            VATUUR. AI Analyse
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium line-clamp-1">{listing.title}</p>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI analyseert dit voertuig...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fetchAnalysis}>
                Opnieuw proberen
              </Button>
            </div>
          )}

          {result && (
            <>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="font-semibold text-foreground">{result.summary}</p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{result.details}</p>

              {result.tips?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Tips
                  </p>
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="mt-0.5 h-5 min-w-5 px-1.5 text-xs">{i + 1}</Badge>
                      <span className="text-foreground/80">{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
