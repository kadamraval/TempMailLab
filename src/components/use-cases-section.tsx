
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, UserCheck, FileDown, TestTube2 } from "lucide-react"

const useCases = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Sign-Up Anonymously",
    description: "Register for websites and apps without exposing your real email. Avoid spam and marketing emails forever.",
  },
  {
    icon: <UserCheck className="h-10 w-10 text-primary" />,
    title: "Protect Your Privacy",
    description: "Keep your personal inbox private. Use a temporary address for forums, newsletters, and social media.",
  },
  {
    icon: <FileDown className="h-10 w-10 text-primary" />,
    title: "Secure Downloads",
    description: "Download e-books, software, or other resources without having to provide your real contact information.",
  },
  {
    icon: <TestTube2 className="h-10 w-10 text-primary" />,
    title: "Developer & QA Testing",
    description: "Quickly generate unlimited email addresses for testing user registration flows and application features.",
  },
]

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Why Temp Mail?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A temporary email address protects your privacy and keeps your primary inbox clean and secure.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="bg-background text-center border">
              <CardHeader className="items-center">
                {useCase.icon}
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                <p className="text-muted-foreground">{useCase.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
