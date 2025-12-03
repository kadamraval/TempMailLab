
"use client"

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Loader2, Newspaper } from "lucide-react"
import type { BlogPost } from "@/app/(admin)/admin/blog/types"
import { useMemo } from "react"

interface BlogSectionProps {
  content: {
    title: string;
    description: string;
  }
}

export function BlogSection({ content }: BlogSectionProps) {
  const firestore = useFirestore();

  // Corrected Query: Removed the orderBy clause that was causing silent failures.
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'posts'), 
        where('status', '==', 'published'),
        limit(3)
    );
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);
  
  // Added client-side sorting to ensure posts are always in the correct order.
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
        const dateA = a.publishedAt instanceof Timestamp ? a.publishedAt.toMillis() : 0;
        const dateB = b.publishedAt instanceof Timestamp ? b.publishedAt.toMillis() : 0;
        return dateB - dateA;
    });
  }, [posts]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!content) {
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

        {sortedPosts && sortedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPosts.map((post: any) => (
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
        ) : (
             <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No Blog Posts Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Published posts from the admin panel will appear here.
                </p>
            </div>
        )}
    </section>
  )
}
