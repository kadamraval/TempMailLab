
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"

interface FeaturesSectionProps {
  content: {
    title: string;
    description: string;
    items: {
      iconName: string;
      title: string;
      description: string;
    }[];
  }
}

export function FeaturesSection({ content }: FeaturesSectionProps) {

  if (!content || !content.items) {
     return null;
  }
  
  return (
    <section id="features">
        {content.title && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.items.map((feature: any) => {
            const Icon = (LucideIcons as any)[feature.iconName] || LucideIcons.HelpCircle;
            return (
              <Card key={feature.title} className="border bg-background">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
    </section>
  )
}
