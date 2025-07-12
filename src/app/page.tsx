import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TempInboxClient } from "@/components/temp-inbox-client";
import { CheckCircle, ShieldCheck, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Privacy Focused",
    description: "Keep your real inbox clean and secure from spam and phishing.",
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Instant Setup",
    description: "Generate a new temporary email address with a single click. No registration required.",
  },
  {
    icon: <Globe className="w-8 h-8 text-primary" />,
    title: "Multiple Domains",
    description: "Choose from a variety of domains to generate your temporary email.",
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-primary" />,
    title: "Easy to Use",
    description: "A simple and intuitive interface to manage your temporary inbox.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <TempInboxClient />

        <section id="features" className="py-16 sm:py-24">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why TempInbox?</h2>
                <p className="mt-4 text-lg text-muted-foreground">Your go-to solution for private and temporary email.</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => (
                    <div key={feature.title} className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <p className="mt-2 text-muted-foreground">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
