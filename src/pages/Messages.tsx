import { useState, useEffect, useRef, useLayoutEffect, useMemo, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  listing_title?: string;
  other_name?: string;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 100;

function formatBubbleTime(d: string) {
  const x = new Date(d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.floor((+today - +that) / 86400000);
  const hm = x.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return hm;
  if (diff === 1) return `Gisteren • ${hm}`;
  if (x.getFullYear() === now.getFullYear()) {
    return `${x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} • ${hm}`;
  }
  return `${x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} • ${hm}`;
}

const Bubble = memo(function Bubble({ msg, mine }: { msg: Message; mine: boolean }) {
  const time = formatBubbleTime(msg.created_at);
  return (
    <div className={cn('flex w-full animate-fade-in', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex flex-col max-w-[75%] min-w-0', mine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3.5 py-2 text-sm leading-snug break-words whitespace-pre-wrap shadow-sm',
            mine
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
              : 'bg-muted text-foreground rounded-2xl rounded-bl-md',
          )}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1 select-none">{time}</span>
      </div>
    </div>
  );
});

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center my-2">
      <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">{label}</span>
    </div>
  );
}

function dayKey(d: string) {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
}
function dayLabel(d: string) {
  const x = new Date(d);
  const now = new Date();
  const diff = Math.floor((+new Date(now.getFullYear(), now.getMonth(), now.getDate()) - +new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
  if (diff === 0) return 'Vandaag';
  if (diff === 1) return 'Gisteren';
  if (x.getFullYear() === now.getFullYear()) {
    return x.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  return x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const c = searchParams.get('c');
    if (c) setSelectedConv(c);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convError) {
        toast.error('Gesprekken konden niet worden geladen');
        setLoading(false);
        return;
      }

      if (data && data.length) {
        const convIds = data.map((c: any) => c.id);
        const listingIds = Array.from(new Set(data.map((c: any) => c.listing_id)));
        const otherIds = Array.from(new Set(data.map((c: any) =>
          c.buyer_id === user.id ? c.seller_id : c.buyer_id,
        )));

        const [listingsRes, profilesRes, msgsRes] = await Promise.all([
          supabase.from('listings').select('id, title').in('id', listingIds),
          supabase.from('public_profiles' as any).select('id, full_name, dealer_name').in('id', otherIds),
          supabase
            .from('messages')
            .select('conversation_id, sender_id, content, read_at, created_at')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: false }),
        ]);

        if (listingsRes.error || profilesRes.error || msgsRes.error) {
          toast.error('Sommige gespreksgegevens konden niet worden geladen');
        }

        const listingMap = new Map((listingsRes.data || []).map((l: any) => [l.id, l.title]));
        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
        const lastMsgMap = new Map<string, string>();
        const unreadMap = new Map<string, number>();
        (msgsRes.data || []).forEach((m: any) => {
          if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m.content);
          if (m.sender_id !== user.id && !m.read_at) {
            unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
          }
        });

        const enriched = data.map((conv: any) => {
          const otherId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
          const p: any = profileMap.get(otherId);
          return {
            ...conv,
            listing_title: listingMap.get(conv.listing_id) || 'Onbekend',
            other_name: p?.dealer_name || p?.full_name || 'Onbekend',
            last_message: lastMsgMap.get(conv.id),
            unread_count: unreadMap.get(conv.id) || 0,
          };
        });
        setConversations(enriched);
      }
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConv)
        .neq('sender_id', user?.id || '')
        .is('read_at', null);
    };
    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user]);

  // Scroll to bottom on initial load (instant) and on new message (smooth)
  const isFirstLoadRef = useRef(true);
  useLayoutEffect(() => {
    if (!selectedConv) return;
    if (isFirstLoadRef.current && messages.length > 0) {
      endRef.current?.scrollIntoView({ block: 'end' });
      isFirstLoadRef.current = false;
    }
  }, [selectedConv, messages.length]);
  useEffect(() => {
    if (!isFirstLoadRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);
  useEffect(() => { isFirstLoadRef.current = true; }, [selectedConv]);

  // Auto-grow textarea up to 5 lines
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineH = 20;
    const max = lineH * 5 + 16;
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, [newMessage]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    const conv = conversations.find((c) => c.id === selectedConv);
    const isFirstOutbound = messages.filter((m) => m.sender_id === user.id).length === 0;
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content,
    });
    if (!error) {
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConv);
      // First outbound from buyer → request reservation on the listing
      if (isFirstOutbound && conv && conv.buyer_id === user.id && conv.listing_id) {
        supabase.functions
          .invoke('reserve-listing', { body: { listing_id: conv.listing_id } })
          .catch(() => undefined);
      }
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConv);
  const visibleMessages = useMemo(() => messages.slice(-visibleCount), [messages, visibleCount]);
  const hasOlder = messages.length > visibleCount;

  // Reset window on conversation switch
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedConv]);

  // Load more when top sentinel is visible
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el || !hasOlder) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const scroller = scrollerRef.current;
        const prevHeight = scroller?.scrollHeight || 0;
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, messages.length));
        requestAnimationFrame(() => {
          if (scroller) {
            const diff = scroller.scrollHeight - prevHeight;
            scroller.scrollTop += diff;
          }
        });
      }
    }, { root: scrollerRef.current, threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasOlder, messages.length]);

  // Keep latest message visible when container resizes (e.g. keyboard opens)
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const ro = new ResizeObserver(() => {
      const nearBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 120;
      if (nearBottom) endRef.current?.scrollIntoView({ block: 'end' });
    });
    ro.observe(sc);
    return () => ro.disconnect();
  }, [selectedConv]);

  // Container height: viewport - header(3.5rem+safe-top); bottom nav clearance handled on input
  const shellHeight =
    'h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] lg:h-[calc(100dvh-4rem)]';

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', shellHeight)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <main className={cn('flex items-center justify-center px-6', shellHeight)}>
        <div className="text-center max-w-sm">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Geen berichten</h1>
          <p className="text-sm text-muted-foreground mt-2">Stuur een bericht via een autodetailpagina om een gesprek te starten.</p>
          <Button asChild className="mt-6">
            <Link to="/zoeken">Auto's bekijken</Link>
          </Button>
        </div>
      </main>
    );
  }


  return (
    <div className={cn('flex w-full overflow-hidden bg-background', shellHeight)}>
      {/* Conversation List */}
      <aside
        className={cn(
          'w-full lg:w-80 lg:border-r border-border/60 flex flex-col min-w-0',
          selectedConv && 'hidden lg:flex',
        )}
      >
        <div className="px-4 h-12 flex items-center border-b border-border/60 shrink-0">
          <h1 className="text-base font-semibold">Berichten</h1>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={cn(
                'w-full px-4 py-3 text-left border-b border-border/40 hover:bg-muted/50 active:bg-muted transition-colors min-h-[64px]',
                selectedConv === conv.id && 'bg-muted/70',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary-strong flex items-center justify-center font-semibold text-sm shrink-0">
                  {(conv.other_name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{conv.other_name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(conv.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.listing_title}</p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message || '—'}</p>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="inline-flex items-center justify-center text-[10px] font-semibold bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-1.5 shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <section
        className={cn(
          'flex-1 flex flex-col min-w-0 min-h-0',
          !selectedConv && 'hidden lg:flex',
        )}
      >
        {selectedConv && selectedConversation ? (
          <>
            {/* Header */}
            <header className="sticky top-0 z-10 h-14 px-2 flex items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 shrink-0"
                onClick={() => setSelectedConv(null)}
                aria-label="Terug"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link
                to={`/auto/${selectedConversation.listing_id}`}
                className="flex-1 min-w-0 flex items-center gap-3 px-1 py-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary-strong flex items-center justify-center font-semibold text-xs shrink-0">
                  {(selectedConversation.other_name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm truncate">{selectedConversation.listing_title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{selectedConversation.other_name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            </header>

            {/* Messages */}
            <div
              ref={scrollerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-1.5"
              style={{ touchAction: 'pan-y' }}
            >
              <div ref={topSentinelRef} />
              {hasOlder && (
                <div className="flex justify-center py-2">
                  <span className="text-[11px] text-muted-foreground">Oudere berichten laden…</span>
                </div>
              )}
              {visibleMessages.map((msg, i) => {
                const prev = visibleMessages[i - 1];
                const showDate = !prev || dayKey(prev.created_at) !== dayKey(msg.created_at);
                return (
                  <div key={msg.id}>
                    {showDate && <DateSeparator label={dayLabel(msg.created_at)} />}
                    <Bubble msg={msg} mine={msg.sender_id === user?.id} />
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur px-2 pt-2 pb-[calc(4rem+max(0.5rem,env(safe-area-inset-bottom)))] lg:pb-2">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="relative flex items-end"
              >
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Typ een bericht…"
                  rows={1}
                  className="w-full resize-none rounded-3xl border border-border/60 bg-muted/40 pl-4 pr-12 py-2.5 text-sm leading-5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 max-h-[120px]"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  aria-label="Verstuur"
                  className={cn(
                    'absolute right-1.5 bottom-1.5 h-9 w-9 rounded-full flex items-center justify-center transition-all',
                    newMessage.trim()
                      ? 'bg-primary text-primary-foreground scale-100 hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground scale-90 cursor-not-allowed',
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecteer een gesprek</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
