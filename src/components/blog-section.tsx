
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const blogPosts = [
  {
    title: "Why You Should Use a Temporary Email Address",
    description: "Learn how a temporary email can protect your privacy and keep your main inbox clean from spam and unwanted newsletters.",
    image: "https://picsum.photos/seed/blog1/600/400",
    link: "/blog/why-use-temp-mail",
    date: "May 20, 2024",
  },
  {
    title: "Top 5 Use Cases for Developers & QA Testers",
    description: "Discover how disposable emails can streamline your development workflow, from user registration testing to API integration.",
    image: "https://picsum.photos/seed/blog2/600/400",
    link: "/blog/use-cases-for-devs",
    date: "May 15, 2024",
  },
  {
    title: "Our New Feature: Custom Domains for Premium Users",
    description: "We're excited to announce that you can now bring your own domain to generate branded temporary email addresses.",
    image: "https://picsum.photos/seed/blog3/600/400",
    link: "/blog/custom-domains-feature",
    date: "May 10, 2024",
  },
]

export function BlogSection({ removeBorder }: { removeBorder?: boolean }) {
  return (
    <section id="blog" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            From the Blog
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with the latest news, updates, and privacy tips from the Tempmailoz team.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.title} className={cn("overflow-hidden flex flex-col", removeBorder ? "border-0" : "border")}>
              <Link href={post.link}>
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={600}
                    height={400}
                    className="w-full h-48 object-cover"
                  />
              </Link>
              <CardHeader>
                <CardTitle className="text-xl">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{post.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">{post.date}</span>
                <Button asChild variant="ghost" size="sm">
                  <Link href={post.link}>
                    Read More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
