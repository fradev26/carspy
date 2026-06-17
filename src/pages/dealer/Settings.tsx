import { Link } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AutoScoutPanel from '@/modules/dealer/AutoScoutPanel';
import { useProfile } from '@/hooks/useProfile';

export default function DealerSettings() {
  const { profile } = useProfile();
  return (
    <div className="container py-6 space-y-6">
      <SEOHead title="Instellingen — VATUUR. Zakelijk" description="Dealer-instellingen en koppelingen." noindex />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> Instellingen
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Beheer koppelingen en bedrijfsgegevens.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Bedrijfsgegevens</CardTitle>
          <CardDescription>Naam, BTW-nummer en contactgegevens van je bedrijf.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Bedrijfsnaam:</span> {profile?.dealer_name ?? '—'}</p>
          <p><span className="text-muted-foreground">BTW:</span> {profile?.vat_number ?? '—'}</p>
          <p><span className="text-muted-foreground">E-mail:</span> {profile?.email ?? '—'}</p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/account/profiel">Profielinstellingen openen</Link>
          </Button>
        </CardContent>
      </Card>

      <AutoScoutPanel />
    </div>
  );
}
