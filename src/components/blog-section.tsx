
"use client"

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import type { BlogPost } from "@/app/(admin)/admin/blog/types"

interface BlogSectionProps {
  content: {
    title: string;
    description: string;
  }
}

export function BlogSection({ content }: BlogSectionProps) {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'posts'), 
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(3)
    );
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!content || !posts || posts.length === 0) {
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
          {posts.map((post: any) => (
            <Card key={post.id} className="overflow-hidden flex flex-col border">
              <Link href={`/blog/${post.slug}`}>
                  <Image
                    src={post.featuredImage || "https://picsum.photos/seed/blog1/600/400"}
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
                <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">{post.publishedAt?.toDate().toLocaleDateString()}</span>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/blog/${post.slug}`}>
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
