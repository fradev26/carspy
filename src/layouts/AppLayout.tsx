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
  const isMessages = location.pathname.startsWith('/berichten');
  const noFooter =
    location.pathname.startsWith('/zakelijk') ||
    location.pathname === '/favorieten' ||
    location.pathname === '/zoeken';

  const mainPad = isMessages
    ? 'pt-[calc(3.5rem+env(safe-area-inset-top))] pb-0 lg:pt-16'
    : isHomepage
      ? 'pt-[calc(3.5rem+env(safe-area-inset-top))] pb-nav lg:pb-0 lg:pt-0'
      : 'pt-[calc(3.5rem+env(safe-area-inset-top))] pb-nav lg:pb-0 lg:pt-16';

  return (
    <AIChatProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className={`flex-1 safe-x ${mainPad}`}>
          <div className={isMessages ? '' : 'animate-fade-in'}>
            <Outlet />
          </div>
        </main>
        {!isMessages && <Footer />}
        {!isMessages && <CompareBar />}
        <BottomNav />
        {!isMessages && (
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
        )}
      </div>
    </AIChatProvider>
  );
}
