
'use client';
import { usePathname } from "next/navigation";
import { FaqSection } from "@/components/faq-section";
import { StayConnected } from "@/components/stay-connected";

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    return (
        <>
            <div className="relative w-full max-w-4xl mx-auto text-center mb-8 px-4">
                {pathname === '/features' && (
                    <>
                        <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                            Features
                        </h1>
                        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Everything you need for secure and private communication, from basic privacy to advanced developer tools.</p>
                    </>
                )}
                {pathname === '/pricing' && (
                     <>
                        <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                            Pricing
                        </h1>
                        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Choose the plan that's right for you, with options for everyone from casual users to professional developers.</p>
                    </>
                )}
                 {pathname === '/blog' && (
                    <>
                        <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                            Blog
                        </h1>
                        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">News, updates, and privacy tips from the Tempmailoz team.</p>
                    </>
                )}
                {pathname === '/api' && (
                     <>
                        <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                            Developer API
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
                            Integrate Tempmailoz's powerful temporary email functionality directly into your applications with our simple and robust REST API.
                        </p>
                    </>
                )}
            </div>
            {children}
            {!isHomePage && (
                <>
                    <FaqSection />
                    <StayConnected />
                </>
            )}
        </>
    )
}
