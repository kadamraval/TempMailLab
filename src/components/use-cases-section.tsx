"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect }from "react";
import { useCases as defaultContent } from "@/lib/content-data";

export function UseCasesSection({ removeBorder }: { removeBorder?: boolean }) {
  const firestore = useFirestore();
  const contentId = 'why';
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', contentId);
  }, [firestore]);

  const { data: content, isLoading, error } = useDoc(contentRef);
  
  useEffect(() => {
      if (!isLoading && !content && !error && firestore) {
          const defaultData = { title: "Why Temp Mail?", description: "Protect your online identity with a disposable email address.", items: defaultContent };
          setDoc(doc(firestore, 'page_content', contentId), defaultData).catch(console.error);
      }
  }, [isLoading, content, error, firestore]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }
  
  const currentContent = content || { title: "Why Temp Mail?", items: defaultContent };

  if (!currentContent || !currentContent.items) {
    return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-muted-foreground">Loading Content...</h2>
        </div>
    );
  }

  return (
    <section id="use-cases">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            {currentContent.title || "Why Temp Mail?"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {currentContent.items.map((useCase: any) => {
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
