"use client"

import {
  ShieldCheck,
  Zap,
  Lock,
  Forward,
  Server,
  Users,
  MousePointerClick,
  Code,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Total Privacy",
    description:
      "Your temporary inboxes are private. All emails are deleted after they expire.",
    className: "lg:col-span-2",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required.",
    className: "lg:col-span-1",
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Spam Protection",
    description: "Keep your primary inbox clean from newsletters and marketing lists.",
    className: "lg:col-span-1",
  },
  {
    icon: <Forward className="w-8 h-8" />,
    title: "Email Forwarding",
    description:
      "Premium users can forward temp emails to their real address, keeping it hidden.",
     className: "lg:col-span-2",
  },
    {
    icon: <Server className="w-8 h-8" />,
    title: "Custom Domains",
    description:
      "Power users can connect their own domains to generate unique, branded temp emails.",
    className: "lg:col-span-3",
  },
  {
    icon: <Code className="w-8 h-8" />,
    title: "Developer API",
    description:
      "Integrate our temp email service into your own applications with our powerful API.",
    className: "lg:col-span-3",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Powerful Features, Simply Delivered
            </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={cn(
                "group/bento shadow-sm hover:shadow-xl transition-shadow duration-200",
                feature.className
              )}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
