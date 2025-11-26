
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FaqSectionProps {
  content: {
    title: string;
    description: string;
    items: {
      question: string;
      answer: string;
    }[];
  }
}

export function FaqSection({ content }: FaqSectionProps) {

    if (!content || !content.items) {
        return null;
    }

    return (
        <section id="faq">
             {content.title && (
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
                </div>
             )}
            <div>
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {content.items.map((faq: any, index: number) => (
                         <AccordionItem key={index} value={`item-${index}`} className="rounded-lg bg-card border">
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
