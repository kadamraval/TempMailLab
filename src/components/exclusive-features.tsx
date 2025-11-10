
"use client";

import { KeyRound, Users, BarChart } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import imageData from '@/app/lib/placeholder-images.json';
import { cn } from "@/lib/utils";

const exclusiveFeatures = [
    {
      icon: <KeyRound className="h-6 w-6 text-primary-foreground" />,
      title: "Password Protection",
      description: "Secure your temporary inboxes with a unique password, ensuring only you can access the contents.",
      image: imageData.exclusiveFeatures[0]
    },
    {
      icon: <Users className="h-6 w-6 text-primary-foreground" />,
      title: "Team Member Access",
      description: "Invite your team to share plan features. Perfect for development teams and QA testing environments.",
      image: imageData.exclusiveFeatures[1]
    },
    {
      icon: <BarChart className="h-6 w-6 text-primary-foreground" />,
      title: "Advanced Analytics",
      description: "Access a detailed dashboard to monitor your temporary email usage, track statistics, and gain insights.",
      image: imageData.exclusiveFeatures[2]
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
                  className={cn(
                    "relative flex flex-col md:flex-row items-center gap-8 p-6 border rounded-lg",
                    "even:bg-gradient-to-r from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30",
                    "odd:bg-gradient-to-r from-teal-100 to-purple-100 dark:from-teal-900/30 dark:to-purple-900/30"
                  )}
                >
                    <div className="w-full md:w-1/2">
                        <Image 
                            src={feature.image.src}
                            alt={feature.image.alt}
                            width={feature.image.width}
                            height={feature.image.height}
                            className="rounded-md object-cover w-full aspect-video"
                            data-ai-hint={feature.image.dataAiHint}
                        />
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="bg-primary text-primary-foreground p-3 rounded-full">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                </motion.div>
              ))}
            </div>

         </div>
    </section>
  );
};
