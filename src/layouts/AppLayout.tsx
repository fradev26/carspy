import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from '@/components/BottomNav';
import { CompareBar } from '@/components/CompareBar';

const ChatWidget = lazy(() => import('@/modules/chat/ChatWidget').then(m => ({ default: m.ChatWidget })));

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
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
  );
}
