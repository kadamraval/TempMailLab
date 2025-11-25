
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export function UseCasesSection({ removeBorder }: { removeBorder?: boolean }) {
  const firestore = useFirestore();
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', 'why');
  }, [firestore]);

  const { data: content, isLoading } = useDoc(contentRef);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!content || !content.items) {
    return <div className="text-center py-16">No use cases content found.</div>;
  }

  return (
    <section id="use-cases">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            {content.title || "Why Temp Mail?"}
          </h2>
        </div>
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

    