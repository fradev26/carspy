import { Link } from 'react-router-dom';
import { Upload, Link2, Plus, FileSpreadsheet } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AutoScoutPanel from '@/modules/dealer/AutoScoutPanel';

export default function Import() {
  return (
    <div className="container py-6 space-y-6">
      <SEOHead title="Import & Sync — VATUUR. Zakelijk" description="Importeer voertuigen via CSV, AutoScout of handmatig." noindex />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary-strong" /> Import & Sync
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Drie manieren om voertuigen aan je voorraad toe te voegen.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader>
            <FileSpreadsheet className="h-8 w-8 text-primary-strong mb-2" />
            <CardTitle className="text-base">CSV upload</CardTitle>
            <CardDescription>Importeer in bulk via een CSV-bestand met kolom-mapping.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">Binnenkort beschikbaar</Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <Link2 className="h-8 w-8 text-primary-strong mb-2" />
            <CardTitle className="text-base">AutoScout24 sync</CardTitle>
            <CardDescription>Automatische tweewegssynchronisatie met je AutoScout-account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="#autoscout">Configureer</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <Plus className="h-8 w-8 text-primary-strong mb-2" />
            <CardTitle className="text-base">Handmatig toevoegen</CardTitle>
            <CardDescription>Eén voertuig via de geleide wizard met foto's en details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/verkopen?dealer=1">Voertuig toevoegen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div id="autoscout">
        <AutoScoutPanel />
      </div>
    </div>
  );
}
