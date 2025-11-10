
"use client"

import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Code,
  Forward,
  Trash2
} from "lucide-react";

const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required.",
    header: <Zap className="h-12 w-12 text-primary" />,
    className: "md:col-span-3 lg:col-span-4",
    icon: <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center"><Zap className="h-4 w-4" /></div>,
  },
  {
    title: "Total Privacy",
    description: "Keep your primary inbox clean from spam and marketing lists.",
    header: <ShieldCheck className="h-12 w-12 text-primary" />,
    className: "md:col-span-3 lg:col-span-4",
    icon: <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center"><ShieldCheck className="h-4 w-4" /></div>,
  },
  {
    title: "Custom Domains",
    description: "Connect your own domains to generate unique, branded temporary emails.",
    header: <Globe className="h-12 w-12 text-primary" />,
    className: "md:col-span-3 lg:col-span-4",
    icon: <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center"><Globe className="h-4 w-4" /></div>,
  },
  {
    title: "Email Forwarding",
    description: "Premium users can forward temporary emails to their real address.",
    header: <Forward className="h-12 w-12 text-primary" />,
    className: "md:col-span-3 lg:col-span-6",
    icon: <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center"><Forward className="h-4 w-4" /></div>,
  },
  {
    title: "Developer API",
    description: "Integrate our temp mail service into your applications with our easy-to-use API.",
    header: <Code className="h-12 w-12 text-primary" />,
    className: "md:col-span-3 lg:col-span-6",
    icon: <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center"><Code className="h-4 w-4" /></div>,
  },
];


export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                Everything You Need
            </h2>
        </div>
        <BentoGrid className="mx-auto md:auto-rows-[20rem]">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={item.className}
              icon={item.icon}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}
