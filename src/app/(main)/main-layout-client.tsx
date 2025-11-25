
'use client';

import { usePathname } from "next/navigation";
import { PageSection } from "@/components/page-section";

const sectionsToShow: { [key: string]: string[] } = {
    '/features': ['faq', 'newsletter'],
    '/pricing': ['faq', 'newsletter'],
    '/blog': ['faq', 'newsletter'],
    '/api': ['faq', 'newsletter'],
    '/contact': ['faq'],
};

const pageInfoMap: { [key: string]: { title: string, description: string } } = {
    '/features': { title: 'Features', description: 'Everything you need for secure and private communication, from basic privacy to advanced developer tools.' },
    '/pricing': { title: 'Pricing', description: 'Choose the plan that\'s right for you, with options for everyone from casual users to professional developers.' },
    '/blog': { title: 'Blog', description: 'News, updates, and privacy tips from the Tempmailoz team.' },
    '/api': { title: 'Developer API', description: 'Integrate Tempmailoz\'s powerful temporary email functionality directly into your applications with our simple and robust REST API.' },
    '/contact': { title: 'Contact Us', description: 'Have questions or need support? We\'re here to help.' },
};

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const pageId = pathname.substring(1) || 'home';

    const pageInfo = pageInfoMap[pathname];
    const sections = sectionsToShow[pathname] || [];

    return (
        <>
            {!isHomePage && pageInfo && (
                <div className="relative w-full max-w-4xl mx-auto text-center mt-16 px-4">
                    <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                        {pageInfo.title}
                    </h1>
                    <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">{pageInfo.description}</p>
                </div>
            )}
            {children}
            {!isHomePage && (
                <>
                    {sections.map((sectionId, index) => (
                         <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
                    ))}
                </>
            )}
        </>
    )
}

    