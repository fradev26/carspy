import { useState } from 'react';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, ShieldCheck, Wrench, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Listing } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AIAnalysisModalProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AnalysisResult {
  summary: string;
  priceVerdict: 'good' | 'fair' | 'high';
  details: string;
  strengths: string[];
  weaknesses: string[];
  marketContext: string;
  ownershipCosts: string;
  tips: string[];
  score: number;
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

const verdictConfig = {
  good: { label: 'Goede deal', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  fair: { label: 'Marktconform', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  high: { label: 'Boven marktprijs', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 7 ? 'text-green-500' : score >= 5 ? 'text-amber-500' : 'text-red-500';
  const bg = score >= 7 ? 'bg-green-500/10' : score >= 5 ? 'bg-amber-500/10' : 'bg-red-500/10';
  return (
    <div className={cn("flex items-center justify-center rounded-md h-16 w-16 border-2", bg, color, "border-current")}>
      <div className="text-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[10px] block -mt-1 opacity-70">/10</span>
      </div>
    </div>
  );
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

  const verdict = result ? verdictConfig[result.priceVerdict] || verdictConfig.fair : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            VATUUR. AI Analyse
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-muted-foreground font-medium line-clamp-1">{listing.title}</p>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI analyseert dit voertuig uitgebreid...</p>
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
              {/* Score + Summary */}
              <div className="flex items-center gap-4 rounded-xl bg-primary/5 border border-primary/20 p-4">
                <ScoreRing score={result.score || 7} />
                <div className="flex-1 space-y-1.5">
                  <p className="font-semibold text-foreground leading-snug">{result.summary}</p>
                  {verdict && (
                    <Badge variant="outline" className={cn("text-xs", verdict.color)}>
                      {verdict.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
              <p className="text-sm text-muted-foreground leading-relaxed">{result.details}</p>

              <Separator />

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.strengths?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                      Sterke punten
                    </p>
                    {result.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="text-foreground/80">{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.weaknesses?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      Aandachtspunten
                    </p>
                    {result.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-foreground/80">{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Market Context */}
              {result.marketContext && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Marktpositie
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{result.marketContext}</p>
                </div>
              )}

              {/* Ownership Costs */}
              {result.ownershipCosts && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Eigendomskosten
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{result.ownershipCosts}</p>
                </div>
              )}

              <Separator />

              {/* Tips */}
              {result.tips?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    Onderhandelingstips
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