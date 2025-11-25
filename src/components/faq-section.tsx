
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { faqs as defaultContent } from "@/lib/content-data";

interface FaqSectionProps {
  removeBorder?: boolean;
  showTitle?: boolean;
  pageId: string;
  sectionId: string;
}

export function FaqSection({ removeBorder, showTitle = true, pageId, sectionId }: FaqSectionProps) {
    const firestore = useFirestore();
    const contentId = `${pageId}_${sectionId}`;
    const contentRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'page_content', contentId);
    }, [firestore, contentId]);

    const { data: content, isLoading, error } = useDoc(contentRef);
    
    useEffect(() => {
      if (!isLoading && !content && !error && firestore) {
        const defaultData = { title: "Questions?", description: "Find answers to frequently asked questions.", items: defaultContent };
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

    const currentContent = content || { title: "Questions?", items: defaultContent };

    if (!currentContent || !currentContent.items) {
        return <div className="text-center py-16">Loading FAQs...</div>;
    }

    return (
        <section id="faq" className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                 {showTitle && (
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{currentContent.title || "Questions?"}</h2>
                    </div>
                 )}
                <div>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {currentContent.items.map((faq: any, index: number) => (
                             <AccordionItem key={index} value={`item-${index}`} className={cn("rounded-lg bg-card", removeBorder ? "border-0" : "border")}>
                                <AccordionTrigger className="text-lg text-left font-semibold hover:no-underline px-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground px-6 pb-6 leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
