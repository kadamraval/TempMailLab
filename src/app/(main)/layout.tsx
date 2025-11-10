
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex flex-col min-h-screen">
       <DotBackground>
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
       </DotBackground>
    </div>
  );
}
