
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, ShieldCheck } from "lucide-react";

const HeroIllustration = () => (
    <svg width="512" height="384" viewBox="0 0 512 384" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg mx-auto">
        <g clipPath="url(#clip0_10_2)">
            <rect width="512" height="384" rx="24" fill="hsl(var(--secondary))"/>
            <rect x="64" y="96" width="384" height="224" rx="16" fill="hsl(var(--background))"/>
            <path d="M64 112C64 103.178 71.1781 96 80 96H432C440.822 96 448 103.178 448 112V128H64V112Z" fill="hsl(var(--muted))"/>
            
            <g className="opacity-80 group-hover:opacity-100 transition-opacity">
                <rect x="208" y="48" width="96" height="96" rx="48" fill="hsl(var(--primary))"/>
                <path d="M256 120L232 96H280L256 120Z" fill="hsl(var(--primary) / 0.5)"/>
                <path d="M244 88H268" stroke="hsl(var(--primary-foreground))" strokeWidth="6" strokeLinecap="round"/>
                <path d="M244 104H260" stroke="hsl(var(--primary-foreground))" strokeWidth="6" strokeLinecap="round"/>
            </g>

            <g transform="translate(100 160)">
                 <rect width="48" height="48" rx="8" fill="hsl(var(--primary) / 0.1)"/>
                <path d="M16 18L24 26L32 18" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="12" y="14" width="24" height="20" rx="2" stroke="hsl(var(--primary))" strokeWidth="3"/>
            </g>
            
            <rect x="164" y="168" width="240" height="12" rx="6" fill="hsl(var(--muted))"/>
            <rect x="164" y="192" width="180" height="12" rx="6" fill="hsl(var(--muted))"/>

            <g transform="translate(100 240)">
                 <rect width="48" height="48" rx="8" fill="hsl(var(--secondary))"/>
                <path d="M16 24H32" stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 16V32" stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </g>

            <rect x="164" y="248" width="240" height="12" rx="6" fill="hsl(var(--muted))"/>
            <rect x="164" y="272" width="210" height="12" rx="6" fill="hsl(var(--muted))"/>
        </g>
        <defs>
            <clipPath id="clip0_10_2">
                <rect width="512" height="384" rx="24" fill="white"/>
            </clipPath>
        </defs>
    </svg>
)

export function Hero() {
    return (
        <main className="flex-grow">
            <section className="container mx-auto px-4 py-16 text-center grid md:grid-cols-2 gap-12 items-center">
                <div className="text-left">
                    <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                        <Mail className="mr-2 h-4 w-4" /> Your Private Inbox Awaits
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                        Secure & Anonymous Temporary Email
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
                        Protect your privacy with disposable email addresses. Keep spam out of your main inbox and stay anonymous online. Perfect for sign-ups, testing, and more.
                    </p>
                    <div className="mt-10 flex items-center gap-x-4">
                        <Button asChild size="lg">
                            <Link href="#inbox">
                                Get Your Temp Email
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="hidden md:block">
                   <HeroIllustration />
                </div>
            </section>
        </main>
    )
}
