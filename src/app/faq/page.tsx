import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
        answer: "A temporary email address is a disposable email that you can use for a short period to sign up for services without revealing your primary email address. This helps protect your real inbox from spam."
    },
    {
        question: "How long does a temporary email address last?",
        answer: "For our free service, the email address is active for 10 minutes. After that, it is permanently deleted and cannot be recovered. Premium users have options for longer-lasting addresses."
    },
    {
        question: "Is this service free?",
        answer: "Yes, the basic service of generating a temporary email is completely free. We also offer premium plans with additional features like custom domains, extended email lifetime, and API access."
    },
    {
        question: "Can I receive attachments?",
        answer: "Yes, our service supports receiving emails with attachments. You can view and download attachments directly from your temporary inbox."
    },
    {
        question: "Is my privacy protected?",
        answer: "Absolutely. We are committed to user privacy. We do not require registration for the free service, and all emails are automatically deleted from our servers after they expire. We do not sell your data."
    }
]

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
                {faqItems.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                        <AccordionContent>
                        {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
