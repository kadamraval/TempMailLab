"use client"

import {
  ShieldCheck,
  Zap,
  Lock,
  Forward,
  Server,
  Code,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Total Privacy",
    description:
      "Your temporary inboxes are private. All emails are deleted after they expire, ensuring your data is never stored long-term.",
    className: "lg:col-span-2",
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required for quick, anonymous use.",
    className: "lg:col-span-1",
  },
  {
    icon: <Lock className="w-8 h-8 text-primary" />,
    title: "Spam Protection",
    description: "Keep your primary inbox clean. Use a temporary address for sign-ups to avoid marketing lists and spam.",
    className: "lg:col-span-1",
  },
  {
    icon: <Forward className="w-8 h-8 text-primary" />,
    title: "Email Forwarding",
    description:
      "Premium users can automatically forward temporary emails to their real address, keeping their primary identity hidden.",
     className: "lg:col-span-2",
  },
    {
    icon: <Server className="w-8 h-8 text-primary" />,
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temporary emails for professional use cases.",
    className: "lg:col-span-3",
  },
  {
    icon: <Code className="w-8 h-8 text-primary" />,
    title: "Developer API",
    description:
      "Integrate our temporary email service directly into your applications with a powerful and easy-to-use API.",
    className: "lg:col-span-3",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};


export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                Powerful Features, Simply Delivered
            </h2>
        </div>
        <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.1 }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={cardVariants} className={cn("h-full", feature.className)}>
                <Card
                className="group/bento h-full bg-card border shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-secondary">
                            {feature.icon}
                        </div>
                        <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
                </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
