"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { blogPosts as defaultContent } from "@/lib/content-data";

export function BlogSection({ removeBorder, showTitle = true }: { removeBorder?: boolean, showTitle?: boolean }) {
  const firestore = useFirestore();
  const contentId = 'blog';
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', contentId);
  }, [firestore]);

  const { data: content, isLoading, error } = useDoc(contentRef);
  
  useEffect(() => {
    if (!isLoading && !content && !error && firestore) {
      const defaultData = { title: "From the Blog", description: "", items: defaultContent };
      setDoc(doc(firestore, 'page_content', contentId), defaultData).catch(console.error);
    }
  }, [isLoading, content, error, firestore]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const currentContent = content || { title: "From the Blog", items: defaultContent };

  if (!currentContent || !currentContent.items) {
    return null;
  }
  
  return (
    <section id="blog">
      <div className="container mx-auto px-4">
        {showTitle && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{currentContent.title || "From the Blog"}</h2>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentContent.items.map((post: any) => (
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
