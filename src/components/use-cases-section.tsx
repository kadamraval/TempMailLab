
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

interface UseCasesSectionProps {
  removeBorder?: boolean;
  content: {
    title: string;
    items: {
      iconName: string;
      title: string;
      description: string;
    }[];
  }
}

export function UseCasesSection({ removeBorder, content }: UseCasesSectionProps) {
  
  if (!content || !content.items) {
    return null;
  }

  return (
    <section id="use-cases">
      <div className="container mx-auto px-4">
        {content.title && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    {content.title}
                </h2>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {content.items.map((useCase: any) => {
            const Icon = (LucideIcons as any)[useCase.iconName] || LucideIcons.HelpCircle;
            return (
              <Card key={useCase.title} className={cn("bg-background text-center", removeBorder && "border-0")}>
                <CardHeader className="items-center">
                  <Icon className="h-10 w-10 text-primary" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

    