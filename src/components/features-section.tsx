
"use client"

import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import { LottieAnimation } from "./ui/lottie-animation";

// Import Lottie JSON data
import rocketAnimation from "@/assets/lottie/rocket.json";
import shieldAnimation from "@/assets/lottie/shield.json";
import forwardAnimation from "@/assets/lottie/forward.json";
import globeAnimation from "@/assets/lottie/globe.json";
import cleanAnimation from "@/assets/lottie/clean.json";
import codeAnimation from "@/assets/lottie/code.json";


const features = [
  {
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    header: <LottieAnimation animationData={rocketAnimation} />,
    className: "md:col-span-1",
  },
  {
    title: "Total Privacy",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    header: <LottieAnimation animationData={shieldAnimation} />,
    className: "md:col-span-2",
  },
  {
    title: "Email Forwarding",
    description: "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
    header: <LottieAnimation animationData={forwardAnimation} />,
    className: "md:col-span-2",
  },
  {
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails.",
    header: <LottieAnimation animationData={globeAnimation} />,
    className: "md:col-span-1",
  },
   {
    title: "Clean Inbox",
    description:
      "All expired inboxes are permanently deleted. Keep only what you need, for as long as you need it.",
    header: <LottieAnimation animationData={cleanAnimation} />,
    className: "md:col-span-1",
  },
  {
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
    header: <LottieAnimation animationData={codeAnimation} />,
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
