import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Copy, Check, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ROLE_DESCRIPTIONS } from './RoleBadge';
import type { CompanyRole } from '@/hooks/usePermissions';

export default function InviteMemberSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<CompanyRole, 'owner'>>('seller');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const reset = () => {
    setStep(1); setFullName(''); setEmail(''); setRole('seller'); setInviteLink(null); setCopied(false);
  };

  const inviteMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('invite_member', {
        _email: email.trim().toLowerCase(),
        _role: role,
        _full_name: fullName.trim() || null,
      });
      if (error) throw error;
      return data as { invitation_id: string; token: string };
    },
    onSuccess: async (data) => {
      const link = `${window.location.origin}/uitnodiging?token=${data.token}`;
      setInviteLink(link);
      qc.invalidateQueries({ queryKey: ['company-members'] });
      qc.invalidateQueries({ queryKey: ['company-invitations'] });
      // Fire-and-forget email send (works once email infra is configured)
      try {
        await supabase.functions.invoke('send-member-invite', {
          body: { invitation_id: data.invitation_id, token: data.token, link, email, full_name: fullName, role },
        });
      } catch { /* ignore — UI shows copyable link */ }
      setStep(3);
    },
    onError: (e: Error) => toast({ title: 'Uitnodiging mislukt', description: e.message, variant: 'destructive' }),
  });

  const handleClose = (o: boolean) => { onOpenChange(o); if (!o) setTimeout(reset, 300); };
  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Medewerker uitnodigen</SheetTitle>
          <SheetDescription>Stap {step} van 3</SheetDescription>
        </SheetHeader>

        {step === 1 && (
          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="inv-name">Naam</Label>
              <Input id="inv-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Voor- en achternaam" />
            </div>
            <div>
              <Label htmlFor="inv-email">E-mailadres *</Label>
              <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@bedrijf.be" />
            </div>
            <Button className="w-full" disabled={!email.includes('@')} onClick={() => setStep(2)}>Volgende</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-6">
            <Label>Rol</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)} className="space-y-2">
              {(['manager', 'seller', 'marketing'] as const).map((r) => (
                <label key={r} htmlFor={`role-${r}`} className="flex items-start gap-3 border border-border/60 rounded-xl p-3 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value={r} id={`role-${r}`} className="mt-0.5" />
                  <div>
                    <div className="font-medium capitalize">{r === 'manager' ? 'Manager' : r === 'seller' ? 'Verkoper' : 'Marketing'}</div>
                    <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Terug</Button>
              <Button className="flex-1" onClick={() => inviteMut.mutate()} disabled={inviteMut.isPending}>
                {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" /> Verstuur</>}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && inviteLink && (
          <div className="space-y-4 mt-6">
            <div className="rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 p-3 text-sm">
              Uitnodiging verstuurd naar <strong>{email}</strong>. Deel onderstaande link indien de e-mail niet aankomt.
            </div>
            <div>
              <Label>Uitnodigingslink (7 dagen geldig)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={inviteLink} readOnly className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => handleClose(false)}>Klaar</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
