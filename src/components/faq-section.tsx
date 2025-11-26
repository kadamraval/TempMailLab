
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";

interface FaqSectionProps {
  removeBorder?: boolean;
  content: {
    title: string;
    items: {
      question: string;
      answer: string;
    }[];
  }
}

export function FaqSection({ removeBorder, content }: FaqSectionProps) {

    if (!content || !content.items) {
        return null;
    }

    return (
        <section id="faq">
             {content.title && (
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h2>
                </div>
             )}
            <div>
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {content.items.map((faq: any, index: number) => (
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
        </section>
    );
}
