
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Globe, Forward } from "lucide-react";

const features = [
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Custom Domains",
      description: "Connect your own domains to generate unique, branded temporary emails.",
    },
    {
      icon: <Forward className="h-8 w-8 text-primary" />,
      title: "Email Forwarding",
      description: "Automatically forward temporary emails to your real address, keeping your identity hidden.",
    },
    {
      icon: <Code className="h-8 w-8 text-primary" />,
      title: "Developer API",
      description: "Integrate our service directly into your applications with a powerful and easy-to-use API.",
    },
];

export const ExclusiveFeatures = () => {
  return (
    <section id="exclusive-features" className="py-16 sm:py-20 bg-muted/30">
         <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Exclusive Premium Features
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="border bg-background">
                  <CardHeader>
                    {feature.icon}
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

         </div>
    </section>
  );
};
