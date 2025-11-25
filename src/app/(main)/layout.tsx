
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';
import { PageSection } from '@/components/page-section';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { unstable_cache } from 'next/cache';

// Server-side function to get sections for a page
const getPageSections = unstable_cache(
  async (pageId: string) => {
    const db = getAdminFirestore();
    const sectionsRef = collection(db, 'pages', pageId, 'sections');
    // Fetch sections ordered by a potential 'order' field, or just by ID
    const sectionsQuery = query(sectionsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(sectionsQuery);
    
    // If no ordered sections, fetch all
    if (snapshot.empty) {
      const allSectionsSnap = await getDocs(sectionsRef);
       return allSectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  ['page_sections'], // Cache key part
  { revalidate: 60 } // Optional: revalidate every 60 seconds
);


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
          {children}
        </main>
        <Footer />
    </div>
  );
}

    