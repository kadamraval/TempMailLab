
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import {
  Code,
  Globe,
  Forward,
} from "lucide-react";

const features = [
    {
      title: "Custom Domains",
      description: "Connect your own domains to generate unique, branded temporary emails.",
      icon: <Globe className="h-8 w-8" />,
    },
    {
      title: "Email Forwarding",
      description: "Automatically forward temporary emails to your real address, keeping your primary identity hidden.",
      icon: <Forward className="h-8 w-8" />,
    },
    {
      title: "Developer API",
      description: "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
      icon: <Code className="h-8 w-8" />,
    },
];

export const ExclusiveFeatures = () => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 0.5], [0, -5]);

  return (
    <section id="exclusive-features" className="py-16 sm:py-20">
         <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Exclusive Premium Features
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Unlock powerful tools designed for developers, testers, and privacy enthusiasts.
                </p>
            </div>
            
            <div ref={targetRef} className="relative h-[150vh]">
                <div className="sticky top-1/4 h-[50vh]">
                    {features.map((feature, i) => {
                        const scale = useTransform(scrollYProgress, [i / features.length, (i + 1) / features.length], [1, 0.85]);
                        return (
                            <motion.div
                                key={feature.title}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    scale,
                                    top: 0,
                                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                                }}
                                className="flex flex-col items-center justify-center p-8 rounded-3xl bg-card border"
                            >
                                <div className="text-primary">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mt-4">{feature.title}</h3>
                                <p className="text-muted-foreground mt-2 max-w-md text-center">{feature.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

         </div>
    </section>
  );
};
