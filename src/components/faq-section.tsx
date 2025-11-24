
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";

const faqs = [
    {
        question: "Why use a temporary email?",
        answer: "It's perfect for any situation where you don't want to give out your real email. This includes signing up for websites, downloading files, or avoiding marketing lists. It keeps your primary inbox clean from spam and protects your privacy."
    },
    {
        question: "How long do inboxes last?",
        answer: "For our free service, inboxes expire after 10 minutes. Our Premium plan offers extended lifetimes, including inboxes that last up to 24 hours, giving you more time to receive important messages."
    },
    {
        question: "Can I use my own domain?",
        answer: "Yes! With our Premium plan, you can connect your own domain names to generate temporary email addresses. This is great for developers, QA testers, or businesses who want branded, disposable email addresses."
    },
    {
        question: "Are my emails secure?",
        answer: "We prioritize your privacy. Once an inbox expires, all associated emails are permanently deleted from our servers. We use secure connections (SSL) to protect your data in transit."
    },
    {
        question: "What's the premium plan?",
        answer: "The Premium plan unlocks powerful features like unlimited inboxes, longer email retention, custom domains, email forwarding, API access, and an ad-free experience."
    },
    {
        question: "Can I recover an expired inbox?",
        answer: "No, once an inbox expires, it and all of its contents are permanently and irretrievably deleted to ensure user privacy. If you need longer-lasting inboxes, please consider our Premium plan."
    }
];

export function FaqSection({ removeBorder }: { removeBorder?: boolean }) {
    return (
        <section id="faq" className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                 <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Questions?</h2>
                </div>
                <div>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
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
