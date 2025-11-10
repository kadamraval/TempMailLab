"use client"

import {
  ShieldCheck,
  Zap,
  Forward,
  Code,
  Globe,
} from "lucide-react"
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>,
    className: "md:col-span-1",
    icon: <Zap className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Total Privacy & Spam Protection",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>,
    className: "md:col-span-2",
    icon: <ShieldCheck className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Email Forwarding",
    description: "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>,
    className: "md:col-span-2",
    icon: <Forward className="h-4 w-4 text-neutral-500" />,
  },
    {
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>,
    className: "md:col-span-1",
    icon: <Globe className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful API.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>,
    className: "md:col-span-3",
    icon: <Code className="h-4 w-4 text-neutral-500" />,
  },
];


export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                Powerful Features, Simply Delivered
            </h2>
        </div>
        <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
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
