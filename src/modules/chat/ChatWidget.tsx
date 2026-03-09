import { useState, useRef, useEffect, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Ik zoek een gezinsauto onder €20.000',
  'Wat is een goede eerste auto?',
  'BMW vs Audi vergelijken',
  'Tips voor een zuinige auto',
];

export const ChatWidget = forwardRef<HTMLDivElement>(function ChatWidget(_props, ref) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, send, clear } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    send(trimmed);
  };

  // Hide on homepage — the inline AIChatSection takes over
  if (isHomepage) return null;

  return (
    <div ref={ref}>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all',
          'bg-primary text-primary-foreground hover:scale-105',
          'bottom-20 right-4 md:bottom-6 md:right-6'
        )}
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl',
            'bottom-36 right-4 w-[calc(100vw-2rem)] max-w-sm',
            'md:bottom-24 md:right-6 md:w-96',
            'h-[min(500px,70vh)]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">VATUUR. AI</p>
                <p className="text-xs opacity-80">Jouw auto-assistent</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Gesprek wissen" className="h-8 w-8 text-primary-foreground hover:bg-primary/80" onClick={clear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
            {messages.length === 0 ? (
              <div className="space-y-3 py-4">
                <p className="text-center text-sm text-muted-foreground">
                  👋 Hoi! Ik ben VATUUR. AI. Stel me een vraag over auto's of gebruik een suggestie:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
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
            )}
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 border-t p-3"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Stel een vraag..."
              aria-label="Stel een vraag aan VATUUR AI"
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" aria-label="Verstuur bericht" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
});
