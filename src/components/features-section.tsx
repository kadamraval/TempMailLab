
"use client"

import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.11S5.34 15.65 4.5 16.5z" />
    <path d="M17.5 7.5c1.5-1.26 2-5 2-5s-3.74.5-5 2c-.71.84-.7 2.3-.05 3.11s.84.71 1.55.05z" />
    <path d="M22 2 11 13" />
    <path d="m2 22 11-11" />
    <path d="m8 2 3.07 3.07" />
    <path d="M13 22V11" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
    <path d="m15 17-5-5 5-5" />
    <path d="m8 17-5-5 5-5" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const CleanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
    <path d="M3.5 2.5a2.5 2.5 0 0 0-3 1.25" />
    <path d="M20.5 2.5a2.5 2.5 0 0 1 3 1.25" />
    <path d="M12 21.5V6" />
    <path d="M12 6c-1.25-1.25-2.5-3-2.5-3s-1.25 1.75-2.5 3" />
    <path d="M12 6c1.25-1.25 2.5-3 2.5-3s1.25 1.75 2.5 3" />
    <path d="M18 21.5H6" />
  </svg>
);

const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary">
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
    </svg>
);

const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    header: <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center p-4 h-full w-full"><RocketIcon /></div>,
    className: "md:col-span-1",
  },
  {
    title: "Total Privacy",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    header: <div className="bg-green-100/50 dark:bg-green-900/20 rounded-lg flex items-center justify-center p-4 h-full w-full"><ShieldIcon /></div>,
    className: "md:col-span-2",
  },
  {
    title: "Email Forwarding",
    description: "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
    header: <div className="bg-purple-100/50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center p-4 h-full w-full"><ForwardIcon /></div>,
    className: "md:col-span-2",
  },
  {
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails.",
    header: <div className="bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center p-4 h-full w-full"><GlobeIcon /></div>,
    className: "md:col-span-1",
  },
   {
    title: "Clean Inbox",
    description:
      "All expired inboxes are permanently deleted. Keep only what you need, for as long as you need it.",
    header: <div className="bg-pink-100/50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center p-4 h-full w-full"><CleanIcon /></div>,
    className: "md:col-span-1",
  },
  {
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
    header: <div className="bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center p-4 h-full w-full"><CodeIcon /></div>,
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
