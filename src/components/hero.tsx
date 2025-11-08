
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, ShieldCheck } from "lucide-react";

export function Hero() {
    return (
      <main className="flex-grow flex items-center justify-center">
        <section className="container mx-auto px-4 py-16 text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                <Mail className="mr-2 h-4 w-4" /> Your Private Inbox Awaits
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Secure, Anonymous, and Temporary Email
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                Protect your privacy with disposable email addresses. Keep spam out of your main inbox and stay anonymous online. Perfect for sign-ups, testing, and more.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                    <Link href="/register">
                        Get Started for Free
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/login">
                       Login
                    </Link>
                </Button>
            </div>
             <div className="mt-12 flex justify-center gap-x-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span>100% Private & Secure</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span>Instant Email Generation</span>
                </div>
            </div>
        </section>
       </main>
    )
}
