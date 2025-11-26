
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface BlogSectionProps {
  content: {
    title: string;
    description: string;
    items: {
      title: string;
      description: string;
      image: string;
      link: string;
      date: string;
    }[];
  }
}

export function BlogSection({ content }: BlogSectionProps) {
  
  if (!content || !content.items) {
    return null;
  }
  
  return (
    <section id="blog">
        {content.title && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.items.map((post: any) => (
            <Card key={post.title} className="overflow-hidden flex flex-col border">
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
    </section>
  )
}
