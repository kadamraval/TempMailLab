
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function BlogSection({ removeBorder, showTitle = true }: { removeBorder?: boolean, showTitle?: boolean }) {
  const firestore = useFirestore();
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', 'blog');
  }, [firestore]);

  const { data: content, isLoading } = useDoc(contentRef);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!content || !content.items) {
    return null;
  }
  
  return (
    <section id="blog">
      <div className="container mx-auto px-4">
        {showTitle && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title || "From the Blog"}</h2>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.items.map((post: any) => (
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
