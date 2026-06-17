import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const LEAD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealer-lead`;

const LEAD_BLOCK_RE = /```vatuur-lead\s*([\s\S]*?)```/g;

type UseChatOptions = {
  context?: 'default' | 'dealer' | 'business';
  onLeadSubmitted?: (lead: Record<string, string>) => void;
};

async function submitLead(payload: Record<string, unknown>) {
  try {
    const resp = await fetch(LEAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ ...payload, source: 'dealers_page_ai' }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.warn('Lead submit failed:', resp.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Lead submit error:', e);
    return false;
  }
}

export function useChat(options: UseChatOptions = {}) {
  const { context = 'default', onLeadSubmitted } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const submittedLeadsRef = useRef<Set<string>>(new Set());

  const send = useCallback(async (input: string) => {
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], context }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Onbekende fout' }));
        throw new Error(err.error || `Fout ${resp.status}`);
      }

      if (!resp.body) throw new Error('Geen response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // After stream completes: detect dealer-lead blocks in assistant message
      if (context === 'dealer' && assistantSoFar) {
        const matches = [...assistantSoFar.matchAll(LEAD_BLOCK_RE)];
        for (const m of matches) {
          const raw = m[1].trim();
          if (submittedLeadsRef.current.has(raw)) continue;
          try {
            const lead = JSON.parse(raw) as Record<string, string>;
            if (lead.email && lead.name) {
              submittedLeadsRef.current.add(raw);
              const ok = await submitLead(lead);
              if (ok) onLeadSubmitted?.(lead);
            }
          } catch {
            console.warn('Invalid lead JSON from AI:', raw);
          }
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      upsertAssistant(e instanceof Error ? e.message : 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, onLeadSubmitted]);

  const clear = useCallback(() => {
    setMessages([]);
    submittedLeadsRef.current.clear();
  }, []);

  return { messages, isLoading, send, clear };
}
