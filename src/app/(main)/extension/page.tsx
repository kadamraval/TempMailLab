
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Chrome, Zap, MousePointerSquare } from "lucide-react";

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

const installSteps = [
    {
        step: 1,
        title: "Download the Extension",
        description: "Click the button below to download the extension files as a .zip folder, then unzip it on your computer.",
        icon: <Zap className="h-6 w-6 text-primary" />
    },
    {
        step: 2,
        title: "Open Chrome Extensions",
        description: "In Chrome, go to the extensions page by typing chrome://extensions in your address bar or through the main menu.",
        icon: <Chrome className="h-6 w-6 text-primary" />
    },
    {
        step: 3,
        title: "Load Unpacked",
        description: "Enable 'Developer mode' in the top right, then click 'Load unpacked' and select the unzipped extension folder.",
        icon: <MousePointerSquare className="h-6 w-6 text-primary" />
    },
];

export default function ExtensionPage() {
    return (
        <div className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                        Temp Mailer for Chrome
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        The full power of Temp Mailer, right in your browser. Generate disposable emails on the fly, protect your privacy, and keep your main inbox clean.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
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
                
                <div className="max-w-4xl mx-auto">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
                            How to Install
                        </h2>
                    </div>
                     <div className="relative">
                        {/* Dotted line connector */}
                        <div className="absolute left-1/2 top-8 bottom-8 w-px bg-border -translate-x-1/2 hidden md:block" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {installSteps.map((step) => (
                                <div key={step.step} className="relative flex flex-col items-center text-center">
                                    <div className="absolute -top-4 h-8 w-8 rounded-full bg-background border-2 border-primary text-primary flex items-center justify-center font-bold">
                                        {step.step}
                                    </div>
                                    <Card className="mt-8 w-full">
                                         <CardHeader className="items-center">
                                            <div className="bg-primary/10 p-3 rounded-full">
                                                {step.icon}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                                            <p className="text-muted-foreground">{step.description}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="text-center mt-12">
                        <Button size="lg" asChild>
                           <a href="/extension.zip" download>
                             <Chrome className="mr-2 h-5 w-5" />
                             Download Extension (.zip)
                           </a>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
