import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Pencil,
  ChevronRight,
  Link2,
  ShoppingBag,
  Car,
  Facebook,
  Settings as SettingsIcon,
  Users,
  CreditCard,
  LifeBuoy,
  Mail,
  Info,
  Clock,
  LucideIcon,

} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import AutoScoutPanel from '@/modules/dealer/AutoScoutPanel';
import ComingSoonConnectionPanel from '@/components/dealer/ComingSoonConnectionPanel';
import OpeningHoursEditor from '@/components/dealer/OpeningHoursEditor';

import { cn } from '@/lib/utils';

type RowProps = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
};

function SettingsRow({ icon: Icon, label, subtitle, to, onClick, disabled, badge }: RowProps) {
  const inner = (
    <div
      className={cn(
        'flex items-center gap-3 h-14 px-4 md:px-5 transition-colors',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:bg-muted/40 active:bg-muted/60 cursor-pointer',
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{label}</span>
          {badge && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );

  if (disabled) return inner;
  if (to)
    return (
      <Link to={to} className="block focus:outline-none focus-visible:bg-muted/40">
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className="w-full text-left focus:outline-none focus-visible:bg-muted/40">
      {inner}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-strong/80 px-1 mb-2">
        {title}
      </h2>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden divide-y divide-border/60">
        {children}
      </div>
    </section>
  );
}

export default function DealerSettings() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [autoScoutOpen, setAutoScoutOpen] = useState(false);
  const [stubOpen, setStubOpen] = useState<null | 'marktplaats' | 'mobile' | 'facebook'>(null);
  const [hoursOpen, setHoursOpen] = useState(false);


  const STUBS = {
    marktplaats: { name: 'Marktplaats', description: 'Synchroniseer je voorraad met Marktplaats.nl.' },
    mobile: { name: 'Mobile.de', description: 'Synchroniseer je voorraad met Mobile.de.' },
    facebook: { name: 'Facebook Marketplace', description: 'Publiceer je voorraad op Facebook Marketplace.' },
  } as const;

  const soon = () =>
    toast({ title: 'Binnenkort beschikbaar', description: 'Deze functie is in ontwikkeling.' });

  return (
    <div className="container max-w-2xl py-6 space-y-6 pb-24">
      <SEOHead title="Instellingen — VATUUR. Zakelijk" description="Dealer-instellingen en koppelingen." noindex />

      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary-strong" />
        <h1 className="text-xl font-bold">Instellingen</h1>
      </div>

      {/* Bedrijfskaart */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4 md:p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold truncate">
            {profile?.dealer_name ?? profile?.full_name ?? 'Test Garage'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            BTW: {profile?.vat_number ?? '—'}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
          <Link to="/account/profiel">
            <Pencil className="h-3.5 w-3.5" />
            Profiel bewerken
          </Link>
        </Button>
      </div>

      <Section title="Koppelingen">
        <SettingsRow icon={Link2} label="AutoScout24" subtitle="Publicatie-instellingen per koppeling" onClick={() => setAutoScoutOpen(true)} />
        <SettingsRow icon={ShoppingBag} label="Marktplaats" badge="Binnenkort" onClick={() => setStubOpen('marktplaats')} />
        <SettingsRow icon={Car} label="Mobile.de" badge="Binnenkort" onClick={() => setStubOpen('mobile')} />
        <SettingsRow icon={Facebook} label="Facebook Marketplace" badge="Binnenkort" onClick={() => setStubOpen('facebook')} />
      </Section>

      <Section title="Voorraad">
        <SettingsRow icon={SettingsIcon} label="Voorraadvoorkeuren" to="/zakelijk/voorraad-instellingen" />
      </Section>

      <Section title="Dealerpagina">
        <SettingsRow icon={Clock} label="Openingsuren" subtitle="Zichtbaar op je publieke dealerpagina" onClick={() => setHoursOpen(true)} />
      </Section>


      <Section title="Account">
        <SettingsRow icon={Users} label="Gebruikers beheren" to="/zakelijk/gebruikers" subtitle="Medewerkers, rollen & activiteit" />
        <SettingsRow icon={CreditCard} label="Abonnement" to="/zakelijk/abonnement" />
      </Section>

      <Section title="Ondersteuning">
        <SettingsRow icon={LifeBuoy} label="Support" to="/help" />
        <SettingsRow icon={Mail} label="Contact" to="/contact" />
        <SettingsRow icon={Info} label="Over VATUUR" to="/" />
      </Section>

      <Sheet open={autoScoutOpen} onOpenChange={setAutoScoutOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>AutoScout24 koppeling</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <AutoScoutPanel />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={hoursOpen} onOpenChange={setHoursOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Openingsuren</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <OpeningHoursEditor />
          </div>
        </SheetContent>
      </Sheet>



      <Sheet open={stubOpen !== null} onOpenChange={(v) => !v && setStubOpen(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{stubOpen ? STUBS[stubOpen].name : ''} koppeling</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {stubOpen && <ComingSoonConnectionPanel name={STUBS[stubOpen].name} description={STUBS[stubOpen].description} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
