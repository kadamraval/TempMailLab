
"use client"

import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const AnimatedZap = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" className="opacity-70">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </polygon>
    </svg>
);

const AnimatedShield = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z">
          <animate attributeName="stroke-dasharray" from="60" to="120" dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-dashoffset" from="0" to="-60" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
);

const AnimatedForward = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12">
        <animateTransform attributeName="transform" type="translate" values="0 0; -2 0; 0 0" dur="1.5s" repeatCount="indefinite" />
      </path>
    </svg>
);

const AnimatedGlobe = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="10s" repeatCount="indefinite" />
      </path>
    </svg>
);

const AnimatedCode = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
       <path d="M10 20l4-16" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20;0;20" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
);

const AnimatedShieldCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </path>
    </svg>
);


const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 flex items-center justify-center"><AnimatedZap /></div>,
    className: "md:col-span-1",
  },
  {
    title: "Total Privacy",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 flex items-center justify-center"><AnimatedShield /></div>,
    className: "md:col-span-2",
  },
  {
    title: "Email Forwarding",
    description: "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 flex items-center justify-center"><AnimatedForward /></div>,
    className: "md:col-span-2",
  },
  {
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 flex items-center justify-center"><AnimatedGlobe /></div>,
    className: "md:col-span-1",
  },
   {
    title: "Secure & Reliable",
    description:
      "Our platform uses industry-standard encryption, and all expired inboxes are permanently deleted.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 flex items-center justify-center"><AnimatedShieldCheck /></div>,
    className: "md:col-span-1",
  },
  {
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 flex items-center justify-center"><AnimatedCode /></div>,
    className: "md:col-span-2",
  },
];


export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                Features
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
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}
