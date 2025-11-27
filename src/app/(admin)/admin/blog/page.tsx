'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { getPostColumns } from './columns';
import type { BlogPost } from './types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from '@/components/ui/card';
import { createSampleBlogPostsAction } from '@/lib/actions/blog';

export default function AdminBlogPage() {
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        if (userProfile?.isAdmin) {
            return collection(firestore, 'posts');
        } else {
            // For non-admins, only show published posts (though they shouldn't be on this page)
            return query(collection(firestore, 'posts'), where('status', '==', 'published'));
        }
    }, [firestore, userProfile?.isAdmin]);

    const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);
    
    // Effect to create sample posts on initial load if none exist
    useEffect(() => {
        if (!isLoading && posts && posts.length === 0 && userProfile?.isAdmin) {
            createSampleBlogPostsAction().then(result => {
                if (result.success) {
                    toast({ title: 'Sample Posts Created', description: 'Three sample blog posts have been added for you.' });
                } else if (result.error) {
                    console.error(result.error);
                }
            });
        }
    }, [isLoading, posts, toast, userProfile?.isAdmin]);


    const handleAdd = useCallback(() => {
        router.push('/admin/blog/add');
    }, [router]);

    const handleEdit = useCallback((post: BlogPost) => {
        router.push(`/admin/blog/edit/${post.id}`);
    }, [router]);

    const handleDelete = useCallback((post: BlogPost) => {
        setDeletingPost(post);
    }, []);

    const confirmDelete = async () => {
        if (!deletingPost || !firestore) return;

        try {
            await deleteDoc(doc(firestore, "posts", deletingPost.id));
            toast({ title: "Success", description: "Blog post deleted successfully." });
        } catch (error: any) {
            toast({
                title: "Error Deleting Post",
                description: error.message || "An unknown error occurred.",
                variant: "destructive",
            });
        } finally {
            setDeletingPost(null);
        }
    };
    
    const columns = useMemo(() => getPostColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={posts || []}
                        filterColumn="title"
                        onAdd={handleAdd}
                        addLabel="Add Post"
                    />
                </CardContent>
            </Card>

            <AlertDialog open={!!deletingPost} onOpenChange={(open) => !open && setDeletingPost(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the post
                            titled <span className="font-bold">"{deletingPost?.title}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
