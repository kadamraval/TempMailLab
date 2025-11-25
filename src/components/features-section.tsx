
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { features as defaultContent } from "@/lib/content-data";

interface FeaturesSectionProps {
  showTitle?: boolean;
  pageId: string;
  sectionId: string;
}

export function FeaturesSection({ showTitle = true, pageId, sectionId }: FeaturesSectionProps) {
  const firestore = useFirestore();
  const contentId = `${pageId}_${sectionId}`;
  const contentRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'page_content', contentId);
  }, [firestore, contentId]);

  const { data: content, isLoading, error } = useDoc(contentRef);
  
  useEffect(() => {
    if (!isLoading && !content && !error && firestore) {
      const defaultData = { title: "Features", description: "Discover the powerful features that make our service unique.", items: defaultContent };
      setDoc(doc(firestore, 'page_content', contentId), defaultData).catch(console.error);
    }
  }, [isLoading, content, error, firestore, contentId]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const currentContent = content || { title: "Features", items: defaultContent };

  if (!currentContent || !currentContent.items) {
     return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-muted-foreground">Loading Content...</h2>
        </div>
    );
  }
  
  return (
    <section id="features">
      <div className="container mx-auto px-4">
        {showTitle && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{currentContent.title || "Features"}</h2>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentContent.items.map((feature: any) => {
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
