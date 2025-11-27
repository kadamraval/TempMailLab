'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useParams, notFound } from 'next/navigation';
import { type BlogPost } from '@/app/(admin)/admin/blog/types';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import { PageSection } from '@/components/page-section';
import DOMPurify from 'isomorphic-dompurify';

export default function BlogPostPage() {
  const { slug } = useParams();
  const firestore = useFirestore();

  const postQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'posts'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: posts, isLoading } = useCollection<BlogPost>(postQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return notFound();
  }

  const post = posts[0];
  const publishedDate = post.publishedAt?.toDate ? format(post.publishedAt.toDate(), 'MMMM d, yyyy') : 'N/A';
  
  // Sanitize the HTML content
  const cleanHtml = DOMPurify.sanitize(post.content);


  return (
    <div className="py-12 md:py-20">
        <div className="container max-w-4xl mx-auto px-4">
            <article className="space-y-8">
                <header className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight">{post.title}</h1>
                    <div className="flex justify-center items-center gap-6 text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{publishedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>By Admin</span>
                        </div>
                    </div>
                </header>
                
                {post.featuredImage && (
                     <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                        <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                
                <div 
                  className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanHtml }}
                />

                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                )}
            </article>

             <PageSection pageId="blog-page" sectionId="newsletter" order={1} />
        </div>
    </div>
  );
}
