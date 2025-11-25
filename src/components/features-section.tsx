
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Zap, Trash2, Globe, Forward, Code } from "lucide-react"

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Instant Setup",
    description: "Generate a new email address with a single click. No registration required.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Total Privacy",
    description: "Keep your primary inbox clean from spam and marketing lists.",
  },
  {
    icon: <Trash2 className="h-8 w-8 text-primary" />,
    title: "Auto-Deletion",
    description: "All emails are automatically and permanently deleted after a set time.",
  },
  {
    icon: <Globe className="h-8 w-8 text-primary" />,
    title: "Custom Domains",
    description: "Connect your own domain to generate branded temporary email addresses.",
  },
  {
    icon: <Forward className="h-8 w-8 text-primary" />,
    title: "Email Forwarding",
    description: "Automatically forward incoming temporary emails to a real, verified email address.",
  },
  {
    icon: <Code className="h-8 w-8 text-primary" />,
    title: "Developer API",
    description: "Integrate our temporary email service directly into your applications.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="border bg-background">
              <CardHeader>
                {feature.icon}
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
