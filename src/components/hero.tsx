
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const HeroIllustration = () => (
    <div className="relative">
      <svg width="512" height="384" viewBox="0 0 512 384" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg mx-auto drop-shadow-xl">
          <g clipPath="url(#clip0_hero_illustration)">
              <rect width="512" height="384" rx="24" className="fill-secondary"/>
              <rect x="48" y="128" width="416" height="208" rx="16" className="fill-background"/>
              <path d="M48 144C48 135.178 55.1781 128 64 128H448C456.822 128 464 135.178 464 144V160H48V144Z" className="fill-muted"/>
              
              {/* Floating email card */}
              <g className="transition-transform duration-300 group-hover:-translate-y-2">
                  <rect x="128" y="48" width="256" height="144" rx="12" className="fill-background shadow-lg"/>
                  <path d="M128 60C128 53.3726 133.373 48 140 48H372C378.627 48 384 53.3726 384 60V72H128V60Z" className="fill-muted"/>
                  <circle cx="148" cy="60" r="4" className="fill-destructive/50"/>
                  <circle cx="164" cy="60" r="4" className="fill-yellow-400/50"/>
                  <circle cx="180" cy="60" r="4" className="fill-green-400/50"/>
                  
                  <g transform="translate(152 96)">
                      <rect width="32" height="32" rx="6" className="fill-primary/10"/>
                      <path d="M10 12L16 18L22 12" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="8" y="10" width="16" height="12" rx="2" stroke="hsl(var(--primary))" strokeWidth="2"/>
                  </g>
                  <rect x="200" y="100" width="140" height="8" rx="4" className="fill-muted"/>
                  <rect x="200" y="116" width="100" height="8" rx="4" className="fill-muted"/>
              </g>
          </g>
          <defs>
              <clipPath id="clip0_hero_illustration">
                  <rect width="512" height="384" rx="24" fill="white"/>
              </clipPath>
          </defs>
      </svg>
    </div>
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
                <div className="hidden md:block group">
                   <HeroIllustration />
                </div>
            </section>
        </main>
    )
}
