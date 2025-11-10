"use client"

import {
  ShieldCheck,
  Zap,
  Forward,
  Code,
  Globe,
  Users
} from "lucide-react"
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import Image from "next/image";

const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    header: <Image src="https://picsum.photos/seed/picsum/1000/1000" width={1000} height={1000} alt="Instant Setup" className="w-full h-full object-cover rounded-xl" />,
    className: "md:col-span-1",
    icon: <Zap className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Total Privacy",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    header: <Image src="https://picsum.photos/seed/privacy/1000/1000" width={1000} height={1000} alt="Privacy" className="w-full h-full object-cover rounded-xl" />,
    className: "md:col-span-2",
    icon: <ShieldCheck className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Email Forwarding",
    description: "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
    header: <Image src="https://picsum.photos/seed/forward/1000/1000" width={1000} height={1000} alt="Forwarding" className="w-full h-full object-cover rounded-xl" />,
    className: "md:col-span-2",
    icon: <Forward className="h-4 w-4 text-neutral-500" />,
  },
    {
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails.",
    header: <Image src="https://picsum.photos/seed/domain/1000/1000" width={1000} height={1000} alt="Custom Domain" className="w-full h-full object-cover rounded-xl" />,
    className: "md:col-span-1",
    icon: <Globe className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
    header: <Image src="https://picsum.photos/seed/api/1000/1000" width={1000} height={1000} alt="API" className="w-full h-full object-cover rounded-xl" />,
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
                Powerful Features
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
