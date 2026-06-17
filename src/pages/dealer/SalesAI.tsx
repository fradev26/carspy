import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Trash2, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/modules/chat/ChatMessage';
import { useChat } from '@/hooks/useChat';
import { useDealerSummary } from '@/hooks/useDealerSummary';
import { useProfile } from '@/hooks/useProfile';
import { KpiGrid } from '@/components/dealer/salesai/KpiGrid';
import { InsightList } from '@/components/dealer/salesai/InsightList';
import { QuickChips } from '@/components/dealer/salesai/QuickChips';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goeiemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

export default function SalesAI() {
  const { profile } = useProfile();
  const { data: summary, isLoading: loadingSummary, refetch } = useDealerSummary();
  const { messages, isLoading, send, clear } = useChat({ context: 'business' });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;
    setInput('');
    send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const name = useMemo(
    () => profile?.dealer_name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || '',
    [profile],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-5rem)] md:h-[calc(100vh-3.5rem-2.5rem)] max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">VATUUR. SalesAI</p>
          <p className="text-[11px] text-muted-foreground">Jouw digitale salesmanager</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Vernieuwen" onClick={() => refetch()} className="h-8 w-8">
          <RefreshCw className={`h-4 w-4 ${loadingSummary ? 'animate-spin' : ''}`} />
        </Button>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" aria-label="Gesprek wissen" onClick={clear} className="h-8 w-8 text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Body */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="p-4 space-y-4">
          {/* Auto-greeting + dashboard */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-bold">{greeting()}{name ? `, ${name}` : ''}</h1>
              <p className="text-sm text-muted-foreground">Hier is je live salesoverzicht. Stel een vraag voor extra detail.</p>
            </div>

            {loadingSummary && (
              <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
                Salesdata laden…
              </div>
            )}

            {summary && (
              <>
                <KpiGrid summary={summary} />
                <InsightList summary={summary} />

                {summary.attention.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Vraagt aandacht (&gt; 60 dagen)
                    </p>
                    <ul className="space-y-1.5">
                      {summary.attention.slice(0, 5).map((a) => (
                        <li key={a.id} className="text-xs flex justify-between gap-2">
                          <a href={`/zakelijk/voorraad/${a.id}`} className="text-primary hover:underline truncate">{a.title}</a>
                          <span className="text-muted-foreground shrink-0">{a.days_online}d · €{a.price?.toLocaleString('nl-BE')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <QuickChips onPick={handleSend} />
          </div>

          {/* Conversation */}
          {messages.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              {messages.map((m, i) => (
                <ChatMessage key={i} message={m} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <span className="animate-pulse text-xs">●●●</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border/60 bg-card p-3 safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Vraag iets aan je SalesAI…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
