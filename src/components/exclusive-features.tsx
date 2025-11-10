
"use client";

import { Code, Globe, Forward } from "lucide-react";
import Image from "next/image";

const exclusiveFeatures = [
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Custom Domains",
      description: "Connect your own domains to generate unique, branded temporary emails for your business or project.",
      image: "https://picsum.photos/seed/domain/600/400",
      dataAiHint: "domain name",
    },
    {
      icon: <Forward className="h-6 w-6 text-primary" />,
      title: "Email Forwarding",
      description: "Automatically forward important temporary emails to your real address, ensuring you never miss a thing.",
      image: "https://picsum.photos/seed/forward/600/400",
      dataAiHint: "email forwarding",
    },
    {
      icon: <Code className="h-6 w-6 text-primary" />,
      title: "Developer API",
      description: "Integrate our powerful temporary email service directly into your applications with a simple, robust API.",
      image: "https://picsum.photos/seed/api/600/400",
      dataAiHint: "developer api",
    },
];

export const ExclusiveFeatures = () => {
  return (
    <section id="exclusive-features" className="py-16 sm:py-20 bg-muted/30">
         <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Exclusive Features
                </h2>
            </div>
            
            <div className="space-y-12 max-w-4xl mx-auto">
              {exclusiveFeatures.map((feature, index) => (
                <div key={feature.title} className="flex flex-col md:flex-row items-center gap-8 p-6 border rounded-lg bg-background">
                    <div className="w-full md:w-1/3">
                        <Image 
                            src={feature.image}
                            alt={feature.title}
                            width={600}
                            height={400}
                            className="rounded-md object-cover"
                            data-ai-hint={feature.dataAiHint}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            {feature.icon}
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                </div>
              ))}
            </div>

         </div>
    </section>
  );
};
