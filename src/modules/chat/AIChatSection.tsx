import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Trash2, Bot, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Welke gezinsauto met automaat onder €18.000 heeft de laagste km-stand?',
  'Is deze BMW 320d uit 2019 voor €22.500 een eerlijke prijs?',
  'Wat zijn de 3 betrouwbaarste hybrides tot €25.000 in België?',
];

const FILTER_BENEFITS = [
  'Begrijpt context: budget + gebruik + voorkeuren tegelijk',
  'Geeft een dealscore 1–10 per wagen, geen verkooppraatjes',
  'Filtert ruis weg — geen 1.200 resultaten doorscrollen',
];

export function AIChatSection() {
  const [input, setInput] = useState('');
  const { messages, isLoading, send, clear } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (messages.length > 0 && !expanded) setExpanded(true);
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
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

  return (
    <section className="hidden lg:block py-10 md:py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Assistent
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">
              Filters tonen alles. <span className="text-primary">VATUUR. AI</span> toont wat past.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Stel je vraag in normale taal. De assistent vergelijkt prijs, km-stand, opties en marktwaarde — en zegt eerlijk wanneer een wagen géén goede deal is.
            </p>
          </div>

          {/* Chat Container */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-elevated overflow-hidden">
            {/* Messages Area */}
            {expanded && (
              <ScrollArea className="max-h-[400px] p-4" ref={scrollRef as any}>
                <div className="space-y-3">
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
              </ScrollArea>
            )}

            {/* Input Area */}
            <div className={cn("p-4", expanded && "border-t border-border/40")}>
              <div className="flex items-end gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="bv. 'gezinsauto automaat onder €18k met lage km'"
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 shrink-0 rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { clear(); setExpanded(false); }}
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Suggestions + waarom beter dan filters */}
            {messages.length === 0 && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-md border border-border/60 bg-muted/50 px-3.5 py-1.5 text-xs text-foreground/80 transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <ul className="grid gap-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground sm:grid-cols-3">
                  {FILTER_BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
