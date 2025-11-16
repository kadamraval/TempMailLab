
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';
import { seedFreePlan } from '@/lib/actions/plans';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Ensure the free plan exists on application startup.
  await seedFreePlan();

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
