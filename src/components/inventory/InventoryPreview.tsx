import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Clock, ArrowRight, Eye, EyeOff, Archive, BellRing } from 'lucide-react';
import { InventoryPrefs } from '@/lib/inventoryPrefsSchema';

export function InventoryPreview({
  prefs,
  activeCount,
}: {
  prefs: InventoryPrefs;
  activeCount: number;
}) {
  const sold = (() => {
    switch (prefs.on_sold_action) {
      case 'hide':
        return { icon: <EyeOff className="h-3.5 w-3.5" />, label: 'Verberg uit zoekresultaten' };
      case 'archive_after_days':
        return {
          icon: <Archive className="h-3.5 w-3.5" />,
          label: `Archiveer na ${prefs.archive_after_days} dagen`,
        };
      default:
        return { icon: <Eye className="h-3.5 w-3.5" />, label: 'Blijft zichtbaar als verkocht' };
    }
  })();

  const lowStockTriggered = activeCount > 0 && activeCount <= prefs.low_stock_threshold;

  return (
    <div className="space-y-3 sticky top-20">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Live voorbeeld
      </div>
      <Card className="border-border/60 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
        <div className="aspect-[16/9] bg-muted/50 flex items-center justify-center">
          <Car className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Voorbeeldadvertentie</p>
            <p className="text-base font-semibold">BMW 320d M Sport</p>
            <p className="text-xs text-muted-foreground">€ 24.950 · 2021 · 65.000 km</p>
          </div>

          <div className="text-xs space-y-2 border-t border-border/60 pt-3">
            <p className="text-muted-foreground font-medium">Bij verkoop:</p>
            <div className="flex items-center gap-2 text-foreground">
              <ArrowRight className="h-3 w-3 text-primary" />
              {prefs.auto_mark_sold ? (
                <span>Status automatisch op <Badge variant="outline" className="text-[10px] ml-1">Verkocht</Badge></span>
              ) : (
                <span>Status handmatig aanpassen</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="inline-flex items-center gap-1">{sold.icon} {sold.label}</span>
            </div>
          </div>

          {prefs.reservation_enabled && (
            <div className="text-xs border-t border-border/60 pt-3 space-y-1">
              <p className="text-muted-foreground font-medium">Bij contactname:</p>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-primary" />
                <span>Gereserveerd voor {prefs.reservation_minutes} min</span>
              </div>
            </div>
          )}

          <div className="text-xs border-t border-border/60 pt-3 space-y-1">
            <p className="text-muted-foreground font-medium">Voorraad:</p>
            <div className="flex items-center justify-between">
              <span className="font-medium">{activeCount} actieve advertenties</span>
              {lowStockTriggered ? (
                <Badge className="text-[10px] gap-1">
                  <BellRing className="h-3 w-3" /> Lage voorraad
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Boven drempel</Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Waarschuwing bij ≤ {prefs.low_stock_threshold} actieve advertenties
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
