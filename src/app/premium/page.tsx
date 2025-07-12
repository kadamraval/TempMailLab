import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { StayConnected } from "@/components/stay-connected";

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "For basic, quick use.",
        features: [
            "10-minute email lifetime",
            "Unlimited email generation",
            "Standard domains",
        ],
        cta: "Get Started",
        href: "/",
    },
    {
        name: "Pro",
        price: "$5",
        pricePeriod: "/ month",
        description: "For power users and developers.",
        features: [
            "Everything in Free, plus:",
            "Up to 24-hour email lifetime",
            "Use your own custom domains",
            "Consolidated inbox for all addresses",
            "API Access",
            "Priority support",
        ],
        cta: "Go Pro",
        href: "/register",
        featured: true,
    }
];

export default function PremiumPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Our Plans</h1>
            <p className="text-muted-foreground mt-2">Choose the plan that's right for you.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => (
                <Card key={plan.name} className={plan.featured ? "border-primary ring-2 ring-primary" : ""}>
                    <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="flex items-baseline pt-4">
                            <span className="text-4xl font-bold">{plan.price}</span>
                            {plan.pricePeriod && <span className="text-muted-foreground">{plan.pricePeriod}</span>}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-3">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center">
                                    <Check className="h-5 w-5 text-primary mr-2" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                         <Button asChild className="w-full" variant={plan.featured ? "default" : "outline"}>
                            <Link href={plan.href}>{plan.cta}</Link>
                         </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </main>
      <StayConnected />
      <Footer />
    </div>
  );
}
