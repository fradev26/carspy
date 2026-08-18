import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Users as UsersIcon, UserPlus, Activity, MoreVertical, Mail, Search,
  Clock, Crown, Loader2, Trash2, UserX, UserCheck, Send, RefreshCw,
  ChevronRight, FileText, Copy,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, type CompanyRole } from '@/hooks/usePermissions';
import { RoleBadge, ROLE_DESCRIPTIONS } from '@/components/dealer/RoleBadge';
import { StatusBadge } from '@/components/dealer/StatusBadge';
import InviteMemberSheet from '@/components/dealer/InviteMemberSheet';
import { cn } from '@/lib/utils';

type Member = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: CompanyRole;
  status: 'active' | 'invited' | 'blocked';
  invited_at: string | null;
  joined_at: string;
  last_active_at: string | null;
};

type Invitation = {
  id: string;
  email: string;
  full_name: string | null;
  role: CompanyRole;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  last_sent_at: string;
  send_count: number;
  created_at: string;
};

type AuditLog = {
  id: string;
  user_id: string | null;
  role_at_time: CompanyRole | null;
  action: string;
  category: string;
  target_table: string | null;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  listing_created: 'Advertentie aangemaakt',
  listing_updated: 'Advertentie gewijzigd',
  listing_deleted: 'Advertentie verwijderd',
  listing_sold: 'Voertuig verkocht',
  boost_started: 'Boost gestart',
  subscription_created: 'Abonnement gestart',
  subscription_updated: 'Abonnement gewijzigd',
  subscription_deleted: 'Abonnement be\u00ebindigd',
  member_invited: 'Medewerker uitgenodigd',
  member_invite_resent: 'Uitnodiging opnieuw verstuurd',
  member_invite_revoked: 'Uitnodiging ingetrokken',
  member_joined: 'Medewerker toegetreden',
  member_role_changed: 'Rol gewijzigd',
  member_deactivated: 'Medewerker gedeactiveerd',
  member_reactivated: 'Medewerker geactiveerd',
  member_removed: 'Medewerker verwijderd',
  company_updated: 'Bedrijfsgegevens gewijzigd',
};

const CATEGORY_LABELS: Record<string, string> = {
  listings: 'Advertenties', boosts: 'Boosts', billing: 'Abonnement',
  users: 'Gebruikers', settings: 'Instellingen', other: 'Overig',
};

function initials(name?: string | null, email?: string | null) {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || src[0]?.toUpperCase() || '?';
}

function Avatar({ name, email, className }: { name?: string | null; email?: string | null; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0', className ?? 'h-10 w-10')}>
      {initials(name, email)}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Crown }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default function DealerUsers() {
  const { user } = useAuth();
  const perms = usePermissions();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'remove' | 'deactivate' | 'reactivate' | 'revoke'; targetId: string; label: string } | null>(null);
  const [auditDetail, setAuditDetail] = useState<AuditLog | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const resendInvite = async (inv: Invitation) => {
    setResendingId(inv.id);
    try {
      const { data, error } = await supabase.rpc('resend_invitation', { _invitation_id: inv.id });
      if (error) throw error;
      const token = (data as { token?: string } | null)?.token;
      const link = token ? `${window.location.origin}/uitnodiging?token=${token}` : null;
      if (link && token) {
        // Fire-and-forget e-mail send; UI keeps copyable link as fallback.
        try {
          await supabase.functions.invoke('send-member-invite', {
            body: {
              invitation_id: inv.id,
              token,
              link,
              email: inv.email,
              full_name: inv.full_name,
              role: inv.role,
            },
          });
        } catch { /* email infra optional */ }
      }
      toast({
        title: `Uitnodiging opnieuw verstuurd naar ${inv.email}`,
        description: link ? 'Tip: kopieer de link als de e-mail niet aankomt.' : undefined,
        action: link
          ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({ title: 'Link gekopieerd' });
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Kopieer link
            </Button>
          )
          : undefined,
      });
      refresh();
    } catch (e) {
      const msg = (e as Error).message ?? '';
      toast({
        title: 'Opnieuw versturen mislukt',
        description: msg.includes('too soon')
          ? 'Je kan binnen 5 minuten geen tweede uitnodiging sturen.'
          : msg.includes('send limit')
            ? 'Maximum aantal herzendingen bereikt. Trek de uitnodiging in en stuur een nieuwe.'
            : msg,
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  const membersQ = useQuery({
    queryKey: ['company-members'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_company_members');
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const invitesQ = useQuery({
    queryKey: ['company-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
  });

  const auditsQ = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['company-members'] });
    qc.invalidateQueries({ queryKey: ['company-invitations'] });
    qc.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const callRpc = async (name: string, args: Record<string, unknown>, success: string) => {
    const { error } = await supabase.rpc(name as never, args as never);
    if (error) { toast({ title: 'Mislukt', description: error.message, variant: 'destructive' }); return; }
    toast({ title: success });
    refresh();
  };

  // ---------- Activity tab state ----------
  const [activityFilter, setActivityFilter] = useState({ user: 'all', category: 'all', q: '' });

  const filteredAudits = (auditsQ.data ?? []).filter((a) => {
    if (activityFilter.user !== 'all' && a.user_id !== activityFilter.user) return false;
    if (activityFilter.category !== 'all' && a.category !== activityFilter.category) return false;
    if (activityFilter.q) {
      const q = activityFilter.q.toLowerCase();
      return (a.target_label?.toLowerCase().includes(q) || ACTION_LABELS[a.action]?.toLowerCase().includes(q) || a.action.toLowerCase().includes(q));
    }
    return true;
  });

  // ---------- Dashboard stats ----------
  const activeCount = (membersQ.data ?? []).filter((m) => m.status === 'active').length;
  const invitedCount = invitesQ.data?.length ?? 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = (auditsQ.data ?? []).filter((a) => new Date(a.created_at) >= today).length;
  const lastLogin = (membersQ.data ?? []).reduce((acc, m) => (m.last_active_at && (!acc || m.last_active_at > acc) ? m.last_active_at : acc), null as string | null);
  const topMember = (() => {
    const counts: Record<string, number> = {};
    (auditsQ.data ?? []).forEach((a) => { if (a.user_id) counts[a.user_id] = (counts[a.user_id] ?? 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return (membersQ.data ?? []).find((m) => m.user_id === top);
  })();

  if (!perms.loading && !perms.isMember) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-xl font-semibold">Geen toegang</h1>
        <p className="text-muted-foreground mt-2">Deze pagina is alleen beschikbaar voor dealeraccounts.</p>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Gebruikers beheren · VATUUR" description="Beheer medewerkers, rollen en activiteit van je dealeraccount." />
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gebruikers beheren</h1>
            <p className="text-sm text-muted-foreground">Medewerkers, rollen en activiteit binnen je dealeraccount.</p>
          </div>
          {perms.canManageUsers && (
            <Button onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" /> Medewerker uitnodigen</Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Actieve gebruikers" value={activeCount} icon={UsersIcon} />
          <StatCard label="Openstaande uitnodigingen" value={invitedCount} icon={Mail} />
          <StatCard label="Activiteit vandaag" value={todayCount} icon={Activity} />
          <StatCard label="Laatste login" value={lastLogin ? formatDistanceToNow(new Date(lastLogin), { locale: nl, addSuffix: true }) : '\u2014'} icon={Clock} />
          <StatCard label="Meest actief" value={topMember?.full_name ?? topMember?.email ?? '\u2014'} icon={Crown} />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users"><UsersIcon className="h-4 w-4 mr-1.5" /> Gebruikers</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1.5" /> Activiteit</TabsTrigger>
          </TabsList>

          {/* ---------- USERS TAB ---------- */}
          <TabsContent value="users" className="space-y-3">
            {membersQ.isLoading ? (
              <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
            ) : (membersQ.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
                <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-3 font-medium">Nog geen medewerkers</p>
                {perms.canManageUsers && <Button className="mt-3" onClick={() => setInviteOpen(true)}>Eerste medewerker uitnodigen</Button>}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
                {(membersQ.data ?? []).map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30">
                    <Avatar name={m.full_name} email={m.email} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium truncate">{m.full_name ?? m.email ?? 'Onbekend'}</div>
                        <RoleBadge role={m.role} />
                        <StatusBadge status={m.status} />
                        {m.user_id === user?.id && <span className="text-xs text-muted-foreground">(jij)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Toegevoegd {format(new Date(m.joined_at), 'd MMM yyyy', { locale: nl })}
                        {m.last_active_at && <> · laatst actief {formatDistanceToNow(new Date(m.last_active_at), { locale: nl, addSuffix: true })}</>}
                      </div>
                    </div>
                    {perms.canManageUsers && m.role !== 'owner' && m.user_id !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">Rol wijzigen</div>
                          {(['manager', 'seller', 'marketing'] as const).filter((r) => r !== m.role).map((r) => (
                            <DropdownMenuItem key={r} onClick={() => callRpc('change_member_role', { _user_id: m.user_id, _role: r }, 'Rol gewijzigd')}>
                              Maak {r === 'manager' ? 'Manager' : r === 'seller' ? 'Verkoper' : 'Marketing'}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          {m.status === 'active' ? (
                            <DropdownMenuItem onClick={() => setConfirm({ kind: 'deactivate', targetId: m.user_id, label: m.full_name ?? m.email ?? '' })}>
                              <UserX className="h-4 w-4 mr-2" /> Deactiveren
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => callRpc('reactivate_member', { _user_id: m.user_id }, 'Geactiveerd')}>
                              <UserCheck className="h-4 w-4 mr-2" /> Activeren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setConfirm({ kind: 'remove', targetId: m.user_id, label: m.full_name ?? m.email ?? '' })}>
                            <Trash2 className="h-4 w-4 mr-2" /> Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(invitesQ.data ?? []).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mt-6 mb-2 text-muted-foreground">Openstaande uitnodigingen</h2>
                <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
                  {(invitesQ.data ?? []).map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 p-3 sm:p-4">
                      <Avatar email={inv.email} className="h-9 w-9 bg-amber-500/10 text-amber-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium truncate">{inv.full_name ?? inv.email}</div>
                          <RoleBadge role={inv.role} />
                          <StatusBadge status="invited" />
                        </div>
                        <div className="text-xs text-muted-foreground">{inv.email} · verloopt {formatDistanceToNow(new Date(inv.expires_at), { locale: nl, addSuffix: true })}</div>
                      </div>
                      {perms.canManageUsers && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={resendingId === inv.id || inv.send_count >= 5}
                            title={`${inv.send_count}/5 verstuurd · laatst ${formatDistanceToNow(new Date(inv.last_sent_at), { locale: nl, addSuffix: true })}`}
                            onClick={() => resendInvite(inv)}
                          >
                            {resendingId === inv.id
                              ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              : <Send className="h-3.5 w-3.5 mr-1" />}
                            Opnieuw versturen
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setConfirm({ kind: 'revoke', targetId: inv.id, label: inv.email })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ---------- ACTIVITY TAB ---------- */}
          <TabsContent value="activity" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={activityFilter.q} onChange={(e) => setActivityFilter((f) => ({ ...f, q: e.target.value }))} placeholder="Zoek in activiteiten..." className="pl-9" />
              </div>
              <Select value={activityFilter.user} onValueChange={(v) => setActivityFilter((f) => ({ ...f, user: v }))}>
                <SelectTrigger aria-label="Filter op gebruiker" className="w-[180px]"><SelectValue placeholder="Gebruiker" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle gebruikers</SelectItem>
                  {(membersQ.data ?? []).map((m) => (<SelectItem key={m.user_id} value={m.user_id}>{m.full_name ?? m.email}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={activityFilter.category} onValueChange={(v) => setActivityFilter((f) => ({ ...f, category: v }))}>
                <SelectTrigger aria-label="Filter op categorie" className="w-[160px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorie\u00ebn</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            {auditsQ.isLoading ? (
              <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
            ) : filteredAudits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">Geen activiteiten gevonden.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
                {filteredAudits.map((a) => {
                  const member = (membersQ.data ?? []).find((m) => m.user_id === a.user_id);
                  return (
                    <button key={a.id} onClick={() => setAuditDetail(a)} className="w-full text-left flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                      <Avatar name={member?.full_name} email={member?.email} className="h-9 w-9" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ACTION_LABELS[a.action] ?? a.action}{a.target_label ? <span className="text-muted-foreground font-normal"> · {a.target_label}</span> : null}</div>
                        <div className="text-xs text-muted-foreground">{member?.full_name ?? member?.email ?? 'Systeem'} · {format(new Date(a.created_at), 'd MMM yyyy HH:mm', { locale: nl })}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InviteMemberSheet open={inviteOpen} onOpenChange={setInviteOpen} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'remove' && 'Medewerker verwijderen?'}
              {confirm?.kind === 'deactivate' && 'Medewerker deactiveren?'}
              {confirm?.kind === 'revoke' && 'Uitnodiging intrekken?'}
              {confirm?.kind === 'reactivate' && 'Medewerker activeren?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'remove' && `${confirm.label} verliest direct alle toegang tot dit dealeraccount.`}
              {confirm?.kind === 'deactivate' && `${confirm.label} kan voorlopig niet meer inloggen op dit account. Je kan dit later terugdraaien.`}
              {confirm?.kind === 'revoke' && `De uitnodiging voor ${confirm.label} wordt direct ongeldig.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === 'remove') callRpc('remove_member', { _user_id: confirm.targetId }, 'Verwijderd');
                if (confirm.kind === 'deactivate') callRpc('deactivate_member', { _user_id: confirm.targetId }, 'Gedeactiveerd');
                if (confirm.kind === 'revoke') callRpc('revoke_invitation', { _invitation_id: confirm.targetId }, 'Ingetrokken');
                setConfirm(null);
              }}
            >Bevestig</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!auditDetail} onOpenChange={(o) => !o && setAuditDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{auditDetail && (ACTION_LABELS[auditDetail.action] ?? auditDetail.action)}</SheetTitle>
          </SheetHeader>
          {auditDetail && (
            <div className="space-y-3 mt-4 text-sm">
              <div><span className="text-muted-foreground">Wanneer:</span> {format(new Date(auditDetail.created_at), "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl })}</div>
              <div><span className="text-muted-foreground">Categorie:</span> {CATEGORY_LABELS[auditDetail.category] ?? auditDetail.category}</div>
              {auditDetail.target_label && <div><span className="text-muted-foreground">Doel:</span> {auditDetail.target_label}</div>}
              {auditDetail.target_table && <div><span className="text-muted-foreground">Tabel:</span> <code className="text-xs">{auditDetail.target_table}</code></div>}
              {auditDetail.target_id && <div><span className="text-muted-foreground">ID:</span> <code className="text-xs">{auditDetail.target_id}</code></div>}
              {auditDetail.ip && <div><span className="text-muted-foreground">IP:</span> {auditDetail.ip}</div>}
              {auditDetail.user_agent && <div><span className="text-muted-foreground">Apparaat:</span> <span className="text-xs">{auditDetail.user_agent}</span></div>}
              {Object.keys(auditDetail.metadata ?? {}).length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1">Details:</div>
                  <pre className="text-xs bg-muted/40 p-3 rounded-lg overflow-auto">{JSON.stringify(auditDetail.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
