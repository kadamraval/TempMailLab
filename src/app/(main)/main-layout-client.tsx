
'use client';
import { usePathname } from "next/navigation";
import { FaqSection } from "@/components/faq-section";
import { StayConnected } from "@/components/stay-connected";

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const pageId = pathname.slice(1) || 'home';

    const getPageTitleAndDescription = () => {
        switch (pathname) {
            case '/features':
                return { title: 'Features', description: 'Everything you need for secure and private communication, from basic privacy to advanced developer tools.' };
            case '/pricing':
                return { title: 'Pricing', description: 'Choose the plan that\'s right for you, with options for everyone from casual users to professional developers.' };
            case '/blog':
                return { title: 'Blog', description: 'News, updates, and privacy tips from the Tempmailoz team.' };
            case '/api':
                return { title: 'Developer API', description: 'Integrate Tempmailoz\'s powerful temporary email functionality directly into your applications with our simple and robust REST API.' };
            default:
                return null;
        }
    }

    const pageInfo = getPageTitleAndDescription();

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
                    <FaqSection pageId={pageId} sectionId="faq" showTitle={true} />
                    <StayConnected />
                </>
            )}
        </>
    )
}
