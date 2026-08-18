import { useEffect, useState } from 'react';
import { z } from 'zod';
import { SEOHead } from '@/components/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Monitor, Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemePref } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

interface Props {
  defaultTab?: 'profiel' | 'meldingen' | 'privacy' | 'weergave';
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Naam is verplicht').max(120),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  location: z.string().trim().max(120).optional().or(z.literal('')),
});

interface NotifPrefs {
  new_messages: boolean;
  search_alerts: boolean;
  listing_status: boolean;
  system: boolean;
  marketing: boolean;
}
interface PrivacyPrefs {
  profile_public: boolean;
  show_contact: boolean;
  marketing_consent: boolean;
}

const DEFAULT_NOTIF: NotifPrefs = { new_messages: true, search_alerts: true, listing_status: true, system: true, marketing: false };
const DEFAULT_PRIV: PrivacyPrefs = { profile_public: true, show_contact: false, marketing_consent: false };

export default function AccountSettings({ defaultTab = 'profiel' }: Props) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ full_name: '', phone: '', location: '', avatar_url: '' as string | null, email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [priv, setPriv] = useState<PrivacyPrefs>(DEFAULT_PRIV);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, n, pr] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, location, avatar_url, email').eq('id', user.id).maybeSingle(),
        supabase.from('notification_preferences').select('new_messages, search_alerts, listing_status, system, marketing').eq('user_id', user.id).maybeSingle(),
        supabase.from('privacy_preferences').select('profile_public, show_contact, marketing_consent').eq('user_id', user.id).maybeSingle(),
      ]);
      if (p.data) setProfile({
        full_name: p.data.full_name ?? '',
        phone: p.data.phone ?? '',
        location: (p.data as { location?: string | null }).location ?? '',
        avatar_url: p.data.avatar_url ?? null,
        email: p.data.email ?? user.email ?? '',
      });
      if (n.data) setNotif(n.data as NotifPrefs);
      if (pr.data) setPriv(pr.data as PrivacyPrefs);
    })();
  }, [user]);

  async function saveProfile() {
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
    }).eq('id', user!.id);
    setSavingProfile(false);
    if (error) toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' });
    else toast({ title: 'Profiel opgeslagen' });
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    const allowed: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
    };
    const ext = allowed[file.type] ?? (file.name.match(/\.(jpe?g|png|webp|avif)$/i)?.[1]?.toLowerCase().replace('jpeg', 'jpg') ?? '');
    if (!ext) {
      toast({ title: 'Ongeldig bestand', description: 'Gebruik JPG, PNG, WEBP of AVIF.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('listing-images').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast({ title: 'Upload mislukt', description: upErr.message, variant: 'destructive' });
      return;
    }
    const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    if (updErr) {
      setUploading(false);
      toast({ title: 'Opslaan mislukt', description: updErr.message, variant: 'destructive' });
      return;
    }
    setProfile((p) => ({ ...p, avatar_url: url }));
    setUploading(false);
    toast({ title: 'Profielfoto bijgewerkt' });
  }

  async function saveNotif(next: NotifPrefs) {
    setNotif(next);
    if (!user) return;
    await supabase.from('notification_preferences').upsert({ user_id: user.id, ...next });
  }
  async function savePriv(next: PrivacyPrefs) {
    setPriv(next);
    if (!user) return;
    await supabase.from('privacy_preferences').upsert({ user_id: user.id, ...next });
  }

  async function resetPassword() {
    if (!profile.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/wachtwoord-reset` });
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else toast({ title: 'E-mail verzonden', description: 'Controleer je inbox om je wachtwoord te wijzigen.' });
  }

  return (
    <div className="container py-8">
      <SEOHead title="Account instellingen — VATUUR." description="Beheer je profiel, meldingen en privacy." noindex />
      <h1 className="text-2xl font-bold">Account instellingen</h1>
      <p className="text-sm text-muted-foreground">Profiel, meldingen en privacyvoorkeuren.</p>

      <Tabs defaultValue={defaultTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="profiel">Profiel</TabsTrigger>
          <TabsTrigger value="meldingen">Meldingen</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="weergave">Weergave</TabsTrigger>
        </TabsList>

        <TabsContent value="profiel" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Persoonlijke gegevens</CardTitle><CardDescription>Deze gegevens zijn zichtbaar voor verkopers en kopers in je gesprekken.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-primary-strong font-semibold">
                    {(profile.full_name || profile.email || '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input id="avatar-input" type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                  <Button variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById('avatar-input')?.click()}>
                    {uploading ? 'Uploaden...' : 'Foto wijzigen'}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">JPG of PNG, max 5 MB.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fn">Volledige naam</Label>
                  <Input id="fn" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                  {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="em">E-mail</Label>
                  <Input id="em" value={profile.email} disabled />
                </div>
                <div>
                  <Label htmlFor="ph">Telefoon</Label>
                  <Input id="ph" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+32 ..." />
                </div>
                <div>
                  <Label htmlFor="loc">Locatie</Label>
                  <Input id="loc" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Stad of regio" />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={savingProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {savingProfile ? 'Opslaan...' : 'Profiel opslaan'}
              </Button>

              <Separator />
              <div>
                <h3 className="font-semibold">Wachtwoord</h3>
                <p className="mt-1 text-sm text-muted-foreground">We sturen je een e-mail om je wachtwoord veilig te wijzigen.</p>
                <Button variant="outline" className="mt-3" onClick={resetPassword}>Wachtwoord wijzigen</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meldingen" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Meldingen</CardTitle><CardDescription>Kies waarover we je per e-mail informeren.</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {([
                ['new_messages', 'Nieuwe berichten', 'Wanneer iemand reageert op je advertentie of gesprek.'],
                ['search_alerts', 'Zoekalerts', 'Nieuwe wagens die aansluiten op je opgeslagen zoekopdrachten.'],
                ['listing_status', 'Status van advertenties', 'Verlopen, gepubliceerd, geboost of verkocht.'],
                ['system', 'Systeemmeldingen', 'Belangrijke updates over je account en beveiliging.'],
                ['marketing', 'Tips & nieuws', 'Marktinzichten, nieuwe functies en aanbiedingen.'],
              ] as const).map(([key, label, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-md px-1 py-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch checked={notif[key]} onCheckedChange={(v) => saveNotif({ ...notif, [key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Privacy</CardTitle><CardDescription>Bepaal wat we delen en met wie.</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {([
                ['profile_public', 'Profiel zichtbaar', 'Kopers kunnen je profielnaam en wagens zien.'],
                ['show_contact', 'Contactgegevens zichtbaar', 'Toon telefoon/e-mail op je advertenties (anders enkel berichten).'],
                ['marketing_consent', 'Toestemming marketing', 'Sta gepersonaliseerde aanbevelingen en mails toe.'],
              ] as const).map(([key, label, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-md px-1 py-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch checked={priv[key]} onCheckedChange={(v) => savePriv({ ...priv, [key]: v })} />
                </div>
              ))}
              <Separator className="my-3" />
              <Button variant="outline" onClick={() => { localStorage.removeItem('cookie-consent'); toast({ title: 'Cookievoorkeuren gereset' }); }}>
                Cookievoorkeuren resetten
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weergave" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Weergave</CardTitle>
              <CardDescription>Kies hoe VATUUR. eruitziet. Je voorkeur wordt op al je toestellen onthouden.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={theme}
                onValueChange={(v) => {
                  const t = v as ThemePref;
                  void setTheme(t);
                  toast({ title: 'Weergave bijgewerkt' });
                }}
                className="grid gap-3 sm:grid-cols-3"
              >
                {([
                  ['system', 'Systeem', 'Volgt automatisch je toestel.', Monitor],
                  ['light', 'Licht', 'Heldere achtergrond, ideaal overdag.', Sun],
                  ['dark', 'Donker', 'Rustig voor de ogen in donkere omgevingen.', Moon],
                ] as const).map(([value, label, desc, Icon]) => {
                  const active = theme === value;
                  return (
                    <Label
                      key={value}
                      htmlFor={`theme-${value}`}
                      className={`flex cursor-pointer flex-col gap-2 rounded-md border bg-card p-4 transition-colors hover:bg-accent/40 ${active ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary-strong" aria-hidden="true" />
                        <RadioGroupItem id={`theme-${value}`} value={value} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
