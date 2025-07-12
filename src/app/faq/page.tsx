import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
    {
        question: "What is a temporary email address?",
        answer: "A temporary email address is a disposable email that you can use for a short period to sign up for services without revealing your primary email address."
    },
    {
        question: "How long does the email address last?",
        answer: "The email address is active for 10 minutes. After that, it is deleted and cannot be recovered."
    },
    {
        question: "Is this service free?",
        answer: "Yes, the basic service of generating a temporary email is completely free. We also offer premium plans with additional features."
    }
]

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>
                        {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}