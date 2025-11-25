
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';
import { FaqSection } from '@/components/faq-section';
import { StayConnected } from '@/components/stay-connected';
import { usePathname } from 'next/navigation';
import { MainLayoutClient } from './main-layout-client';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="relative flex flex-col min-h-screen">
       <DotBackground />
        <Header />
        <main className="flex-grow z-10">
            <MainLayoutClient>
              {children}
            </MainLayoutClient>
        </main>
        <Footer />
    </div>
  );
}
