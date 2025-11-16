
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';
import { seedDefaultPlan } from '@/lib/actions/plan';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Ensure the default plan exists on application startup.
  await seedDefaultPlan();

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
