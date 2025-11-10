
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Chrome, Zap } from "lucide-react";
import Image from "next/image";

const features = [
    {
        icon: <Zap className="h-6 w-6 text-primary" />,
        title: "One-Click Generation",
        description: "Get a new temporary email address instantly, right from your browser toolbar."
    },
    {
        icon: <Check className="h-6 w-6 text-primary" />,
        title: "Auto-Fill Forms",
        description: "Automatically fill sign-up forms with your new temporary email address."
    },
    {
        icon: <Chrome className="h-6 w-6 text-primary" />,
        title: "Seamless Integration",
        description: "Your extension inbox is perfectly synced with your web dashboard."
    }
];

export default function ExtensionPage() {
    return (
        <div className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-center md:text-left">
                        <span className="inline-block bg-primary/10 text-primary font-semibold px-4 py-1 rounded-full text-sm">
                            Coming Soon
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                            Temp Mailer for Chrome
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            The full power of Temp Mailer, right in your browser. Generate disposable emails on the fly, protect your privacy, and keep your main inbox clean.
                        </p>
                        <Button size="lg">
                            <Chrome className="mr-2 h-5 w-5" />
                            Add to Chrome
                        </Button>
                    </div>
                    <div>
                        <Image
                            src="https://picsum.photos/seed/extension/800/600"
                            alt="Temp Mailer Chrome Extension"
                            width={800}
                            height={600}
                            className="rounded-lg shadow-xl"
                            data-ai-hint="browser extension screenshot"
                        />
                    </div>
                </div>

                <div className="mt-24">
                     <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
                            Your Privacy, One Click Away
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <Card key={feature.title} className="text-center">
                                <CardHeader className="items-center">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        {feature.icon}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
