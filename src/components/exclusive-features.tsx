
"use client";

import { KeyRound, Users, BarChart } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const exclusiveFeatures = [
    {
      icon: <KeyRound className="h-6 w-6 text-primary" />,
      title: "Password Protection",
      description: "Secure your temporary inboxes with a unique password, ensuring only you can access the contents.",
      image: "https://picsum.photos/seed/password/600/400",
      dataAiHint: "password security",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Team Member Access",
      description: "Invite your team to share plan features. Perfect for development teams and QA testing environments.",
      image: "https://picsum.photos/seed/team/600/400",
      dataAiHint: "team collaboration",
    },
    {
      icon: <BarChart className="h-6 w-6 text-primary" />,
      title: "Advanced Analytics",
      description: "Access a detailed dashboard to monitor your temporary email usage, track statistics, and gain insights.",
      image: "https://picsum.photos/seed/analytics/600/400",
      dataAiHint: "analytics dashboard",
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
            
            <div className="space-y-8 max-w-5xl mx-auto">
              {exclusiveFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col md:flex-row items-center gap-8 p-6 border rounded-lg bg-background"
                >
                    <div className="w-full md:w-1/2">
                        <Image 
                            src={feature.image}
                            alt={feature.title}
                            width={600}
                            height={400}
                            className="rounded-md object-cover w-full aspect-video"
                            data-ai-hint={feature.dataAiHint}
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="flex items-center gap-3 mb-3">
                            {feature.icon}
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                </motion.div>
              ))}
            </div>

         </div>
    </section>
  );
};
