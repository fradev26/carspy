import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Trash2, Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Ik zoek een gezinsauto onder €20.000',
  'Wat is een goede eerste auto?',
  'BMW vs Audi vergelijken',
  'Zuinige auto met automaat',
  'Beste elektrische SUV?',
  'Tips voor een betrouwbare occasion',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AIFullscreenChat({ open, onClose }: Props) {
  const [input, setInput] = useState('');
  const { messages, isLoading, send, clear } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in slide-in-from-bottom duration-300 lg:hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3 safe-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">VATUUR. AI</p>
            <p className="text-[10px] text-muted-foreground">Jouw slimste auto-assistent</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="h-9 w-9 shrink-0 text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10 mb-5">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">Hoi! Ik ben VATUUR. AI</h3>
            <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
              Zoek, vergelijk en krijg persoonlijk advies over auto's in natuurlijke taal
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-border/60 bg-muted/50 px-3.5 py-2 text-xs text-foreground/80 transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-95"
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
      <div className="border-t border-border/60 bg-card p-3 safe-bottom">
        <div className="flex items-end gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel een vraag..."
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
        </div>
      </div>
    </div>
  );
}
