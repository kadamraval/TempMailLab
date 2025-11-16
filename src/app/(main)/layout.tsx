
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // The free plan is now seeded more robustly within the server actions that need it,
  // rather than blocking the entire application load here.

  return (
    <div className="relative flex flex-col min-h-screen">
       <DotBackground />
        <Header />
        <main className="flex-grow z-10">
            {children}
        </main>
        <Footer />
    </div>
  );
}
