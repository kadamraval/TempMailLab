
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/ui/dot-background';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DotBackground>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </DotBackground>
  );
}
