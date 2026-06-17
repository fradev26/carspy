import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AIFullscreenChat } from '@/modules/chat/AIFullscreenChat';

type AIChatContextValue = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
};

const AIChatContext = createContext<AIChatContextValue | null>(null);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => {
    setOpen(false);
    try { sessionStorage.removeItem('vatuur:reopenChatOnBack'); } catch {}
  }, []);

  useEffect(() => {
    const onNavigate = () => setOpen(false);
    window.addEventListener('vatuur:chat-navigate-listing', onNavigate);
    return () => window.removeEventListener('vatuur:chat-navigate-listing', onNavigate);
  }, []);

  useEffect(() => {
    let flag: string | null = null;
    try { flag = sessionStorage.getItem('vatuur:reopenChatOnBack'); } catch {}
    if (flag === '1' && !location.pathname.startsWith('/auto/')) {
      try { sessionStorage.removeItem('vatuur:reopenChatOnBack'); } catch {}
      setOpen(true);
    }
  }, [location.pathname]);

  return (
    <AIChatContext.Provider value={{ open, openChat, closeChat }}>
      {children}
      <AIFullscreenChat open={open} onClose={closeChat} />
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error('useAIChat must be used within AIChatProvider');
  return ctx;
}
