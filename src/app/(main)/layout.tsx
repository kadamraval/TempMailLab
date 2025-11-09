
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StayConnected } from '@/components/stay-connected';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <StayConnected />
      <Footer />
    </>
  );
}
