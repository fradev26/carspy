import { useState } from 'react';
import { Mail, Clock, MessageCircle, Send } from 'lucide-react';
import { z } from 'zod';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().trim().min(2, 'Naam is verplicht').max(100),
  email: z.string().trim().email('Ongeldig e-mailadres').max(255),
  subject: z.enum(['algemeen', 'kopen', 'verkopen', 'dealer', 'betalingen', 'misbruik']),
  message: z.string().trim().min(10, 'Bericht is te kort').max(2000),
});

const SUBJECTS = [
  { value: 'algemeen', label: 'Algemene vraag' },
  { value: 'kopen', label: 'Hulp bij kopen' },
  { value: 'verkopen', label: 'Hulp bij verkopen' },
  { value: 'dealer', label: 'Dealeraccount' },
  { value: 'betalingen', label: 'Betalingen & facturatie' },
  { value: 'misbruik', label: 'Misbruik melden' },
];

export default function Contact() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: user?.email ?? '', subject: 'algemeen' as const, message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.from('support_messages').insert({
      user_id: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Verzenden mislukt', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Bericht verzonden', description: 'We nemen zo snel mogelijk contact met je op.' });
    setForm({ name: '', email: user?.email ?? '', subject: 'algemeen', message: '' });
  }

  return (
    <div className="container py-8">
      <SEOHead title="Contact — VATUUR." description="Neem contact op met het VATUUR-supportteam." />
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-2 text-muted-foreground">Een vraag, een probleem of een suggestie? We helpen je graag.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader><CardTitle>Stuur ons een bericht</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Naam</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <Label>Onderwerp</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v as typeof form.subject })}>
                    <SelectTrigger aria-label="Onderwerp"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Bericht</Label>
                  <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{form.message.length}/2000</p>
                </div>
                <Button type="submit" disabled={submitting} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Send className="h-4 w-4" />{submitting ? 'Verzenden...' : 'Verstuur bericht'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">E-mail</p>
                    <a href="mailto:support@vatuur.be" className="text-sm text-muted-foreground hover:text-primary">support@vatuur.be</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Reactietijd</p>
                    <p className="text-sm text-muted-foreground">Binnen 1 werkdag</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Helpcentrum</p>
                    <a href="/help" className="text-sm text-muted-foreground hover:text-primary">Veelgestelde vragen →</a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
