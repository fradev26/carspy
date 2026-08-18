import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMsg } from '@/hooks/useChat';
import { Bot, User, Car, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import type { Components } from 'react-markdown';
import { SalesAIResponse, hasSalesAIPayload } from '@/components/dealer/salesai/SalesAIResponse';

interface Props {
  message: ChatMsg;
}


function CarCard({ href, children }: { href: string; children: React.ReactNode }) {
  const text = typeof children === 'string' ? children : '';
  // Extract title and price from "Title - €price" format
  const match = text.match(/^(.+?)\s*-\s*(€[\d.,]+)$/);
  const title = match ? match[1] : text;
  const price = match ? match[2] : '';

  const handleClick = () => {
    try {
      sessionStorage.setItem('vatuur:reopenChatOnBack', '1');
    } catch {}
    window.dispatchEvent(new CustomEvent('vatuur:chat-navigate-listing'));
  };

  return (
    <Link
      to={href}
      onClick={handleClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 my-2 hover:border-primary/50 hover:shadow-md transition-all group no-underline"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-strong group-hover:bg-primary/20 transition-colors">
        <Car className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">{title}</p>
        {price && (
          <p className="text-xs font-semibold text-primary-strong mt-0.5">{price}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">Bekijk →</span>
    </Link>
  );
}

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    if (href && href.startsWith('/auto/')) {
      const childText = Array.isArray(children)
        ? children.map(c => (typeof c === 'string' ? c : '')).join('')
        : typeof children === 'string' ? children : '';
      return <CarCard href={href}>{childText}</CarCard>;
    }
    // Internal links
    if (href && href.startsWith('/')) {
      return (
        <Link to={href} className="text-primary-strong underline hover:text-primary-strong/80">
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-strong underline hover:text-primary-strong/80" {...props}>
        {children}
      </a>
    );
  },
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const isSalesAI = !isUser && hasSalesAIPayload(message.content);

  if (isSalesAI) {
    // Strip vatuur-sales fence; render dashboard UI full-width without bubble.
    const cleaned = message.content.replace(/```vatuur-sales[\s\S]*?(```|$)/g, '').trim();
    return (
      <div className="flex gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <SalesAIResponse rawContent={message.content} />
          {cleaned && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
              <ReactMarkdown components={markdownComponents}>{cleaned}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {isUser ? (
          message.content
        ) : (
          (() => {
            const leadRe = /```vatuur-lead\s*[\s\S]*?```/g;
            const hasLead = leadRe.test(message.content);
            const cleaned = message.content.replace(/```vatuur-lead\s*[\s\S]*?```/g, '').trim();
            return (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {hasLead && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary-strong not-prose">
                    <Check className="h-3.5 w-3.5" />
                    Je gegevens werden doorgestuurd naar onze accountmanager.
                  </div>
                )}
                <ReactMarkdown components={markdownComponents}>{cleaned}</ReactMarkdown>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

