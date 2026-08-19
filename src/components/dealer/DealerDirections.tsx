import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DealerDirectionsProps {
  dealerName: string;
  city?: string;
  province?: string;
  address?: string;
}

/** Routebeschrijving met kaartpreview op /dealer/:slug (A2.4). */
export function DealerDirections({ dealerName, city, province, address }: DealerDirectionsProps) {
  const parts = [dealerName, address, city, province, 'België'].filter(Boolean) as string[];
  if (!city && !address) return null;

  const destination = encodeURIComponent(parts.join(', '));
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=2.5%2C49.5%2C6.4%2C51.6&layer=mapnik`;

  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Navigation className="h-4 w-4 text-primary-strong" aria-hidden="true" />
          Route &amp; bereikbaarheid
        </h2>

        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{[address, city, province].filter(Boolean).join(', ')}</span>
        </p>

        <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
          <iframe
            title={`Kaart met de locatie van ${dealerName}`}
            src={embedUrl}
            loading="lazy"
            className="h-40 w-full"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <Button asChild variant="outline" className="mt-3 w-full gap-2">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            Routebeschrijving openen
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
