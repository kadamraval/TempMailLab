import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 md:py-40">
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-primary/10 text-primary font-semibold px-4 py-1 rounded-full text-sm mb-4">
                Privacy First, Always
            </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
            Secure Your Digital Identity
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Generate instant, private, and secure temporary email addresses. Keep your real inbox safe from spam, trackers, and prying eyes.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button asChild size="lg">
                <Link href="#inbox">
                    Get Your Free Email
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
                <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
