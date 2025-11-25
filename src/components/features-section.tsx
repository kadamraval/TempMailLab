
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export function FeaturesSection({ showTitle = true }: { showTitle?: boolean }) {
  const firestore = useFirestore();
  const contentRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'page_content', 'features');
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
     return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-muted-foreground">No features content found.</h2>
        </div>
    );
  }
  
  return (
    <section id="features">
      <div className="container mx-auto px-4">
        {showTitle && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title || "Features"}</h2>
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
      </div>
    </section>
  )
}
