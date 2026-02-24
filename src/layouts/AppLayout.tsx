import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from '@/components/BottomNav';
import { CompareBar } from '@/components/CompareBar';
import { ChatWidget } from '@/modules/chat/ChatWidget';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <BottomNav />
      <ChatWidget />
    </div>
  );
}
