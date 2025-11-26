'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { BlogPost } from '@/app/(admin)/admin/blog/types';

type BlogPostInput = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Saves a blog post to Firestore. Handles both creating a new post and updating an existing one.
 * @param postData The data for the blog post.
 * @param postId Optional ID of the post to update. If not provided, a new post is created.
 * @returns An object indicating success or an error message.
 */
export async function savePostAction(postData: BlogPostInput, postId?: string) {
    try {
        const firestore = getAdminFirestore();
        const dataToSave: any = { ...postData };
        
        // If the status is changing to 'published' and it wasn't before, set the publishedAt date
        if (postData.status === 'published' && (!postId || (await firestore.doc(`posts/${postId}`).get()).data()?.status !== 'published')) {
            dataToSave.publishedAt = FieldValue.serverTimestamp();
        } else if (postData.status === 'draft') {
            dataToSave.publishedAt = null; // Or FieldValue.delete() if you want to remove it
        }

        if (postId) {
            // Update existing post
            const postRef = firestore.doc(`posts/${postId}`);
            dataToSave.updatedAt = FieldValue.serverTimestamp();
            await postRef.update(dataToSave);
        } else {
            // Create new post
            const collectionRef = firestore.collection("posts");
            dataToSave.createdAt = FieldValue.serverTimestamp();
            dataToSave.updatedAt = FieldValue.serverTimestamp();
            await collectionRef.add(dataToSave);
        }
        
        revalidatePath('/admin/blog');
        revalidatePath('/blog');
        return { success: true };

    } catch (error: any) {
        return { error: error.message || 'An unknown error occurred.' };
    }
}
