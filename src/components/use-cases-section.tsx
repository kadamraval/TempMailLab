
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, UserCheck, FileDown, TestTube2 } from "lucide-react"

const useCases = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Sign-Up Anonymously",
    description: "Register for sites and apps without exposing your real email.",
  },
  {
    icon: <UserCheck className="h-10 w-10 text-primary" />,
    title: "Protect Your Privacy",
    description: "Use a temporary address for forums, newsletters, and social media.",
  },
  {
    icon: <FileDown className="h-10 w-10 text-primary" />,
    title: "Secure Downloads",
    description: "Download resources without providing your real contact info.",
  },
  {
    icon: <TestTube2 className="h-10 w-10 text-primary" />,
    title: "Developer & QA Testing",
    description: "Quickly generate addresses for user registration and app testing.",
  },
]

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Why Temp Mail?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
