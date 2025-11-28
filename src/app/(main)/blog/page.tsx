
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, ArrowRight } from 'lucide-react';
import { type BlogPost } from '@/app/(admin)/admin/blog/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PageSection } from '@/components/page-section';

export default function BlogPage() {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);

  return (
    <>
      <PageSection pageId="blog-page" sectionId="top-title" order={0} />

      <div className="container mx-auto py-12 md:py-20">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(posts || []).map((post) => (
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
                   <span className="text-sm text-muted-foreground">
                    {post.publishedAt && post.publishedAt instanceof Timestamp 
                        ? post.publishedAt.toDate().toLocaleDateString() 
                        : 'N/A'
                    }
                   </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {posts && posts.length > 0 && (
          <div className="text-center my-12">
            <Button variant="outline">Load More Posts</Button>
          </div>
        )}
      </div>

      <PageSection pageId="blog-page" sectionId="faq" order={2} />
      <PageSection pageId="blog-page" sectionId="newsletter" order={3} />
    </>
  );
}
