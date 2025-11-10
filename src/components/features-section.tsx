
"use client"

import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";

const AnimatedZap = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6L14 26H26L22 42L34 22H22L24 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" from="0 100" to="100 0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="fill" values="transparent;currentColor;transparent" dur="2s" repeatCount="indefinite" />
        </path>
    </svg>
);

const AnimatedShield = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 44C24 44 40 36 40 24V10L24 4L8 10V24C8 36 24 44 24 44Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 24L23 28L31 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0">
            <animate attributeName="opacity" values="0; 1; 0" dur="2s" repeatCount="indefinite" />
        </path>
    </svg>
);

const AnimatedForward = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 24H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 14L40 24L30 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <animateTransform attributeName="transform" type="translate" values="0 0; 4 0; 0 0" dur="1.5s" repeatCount="indefinite" />
        </path>
         <path d="M12 10V38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    </svg>
);

const AnimatedGlobe = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2"/>
        <ellipse cx="24" cy="24" rx="9" ry="18" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
        <path d="M6 24H42" stroke="currentColor" strokeWidth="2">
            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="10s" repeatCount="indefinite" />
        </path>
    </svg>
);

const AnimatedCode = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 16L10 24L18 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" from="24" to="0" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M30 16L38 24L30 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" from="0" to="24" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M22 36L26 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" from="30" to="0" dur="2s" repeatCount="indefinite" />
        </path>
    </svg>
);

const AnimatedInbox = () => (
     <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 16L24 28L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 16H40V38H8V16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 22L14 28" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0">
             <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite" />
        </path>
        <path d="M34 28L28 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0">
             <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </path>
    </svg>
);


const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500"><AnimatedZap /></div>,
    className: "md:col-span-1",
  },
  {
    title: "Total Privacy",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-500"><AnimatedShield /></div>,
    className: "md:col-span-2",
  },
  {
    title: "Email Forwarding",
    description: "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500"><AnimatedForward /></div>,
    className: "md:col-span-2",
  },
  {
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-500"><AnimatedGlobe /></div>,
    className: "md:col-span-1",
  },
   {
    title: "Clean Inbox",
    description:
      "All expired inboxes are permanently deleted. Keep only what you need, for as long as you need it.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center text-teal-500"><AnimatedInbox /></div>,
    className: "md:col-span-1",
  },
  {
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
    header: <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-500"><AnimatedCode /></div>,
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
