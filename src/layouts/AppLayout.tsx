import { lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from '@/components/BottomNav';
import { CompareBar } from '@/components/CompareBar';
import { AIChatProvider } from '@/context/AIChatContext';

const ChatWidget = lazy(() => import('@/modules/chat/ChatWidget').then(m => ({ default: m.ChatWidget })));

export function AppLayout() {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <AIChatProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className={`flex-1 pb-nav lg:pb-0 safe-x ${isHomepage ? 'pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0' : 'pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-16'}`}>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer />
        <CompareBar />
        <BottomNav />
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </div>
    </AIChatProvider>
  );
}
