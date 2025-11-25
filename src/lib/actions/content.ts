
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Saves or updates content for a specific section in Firestore.
 * @param fullPath The full path to the document (e.g., 'pages/home/sections/faq').
 * @param data The content data object to save.
 */
export async function saveContentAction(fullPath: string, data: any) {
    if (!fullPath || !data) {
        return { success: false, error: 'Document path and data are required.' };
    }

    try {
        const firestore = getAdminFirestore();
        const contentRef = firestore.doc(fullPath);
        
        // Ensure 'createdAt' is set only on document creation
        const docSnap = await contentRef.get();
        if (!docSnap.exists) {
            data.createdAt = FieldValue.serverTimestamp();
        }
        data.updatedAt = FieldValue.serverTimestamp();
        
        // Use set with merge to create or update the document.
        await contentRef.set(data, { merge: true });

        // Revalidate all paths to reflect content changes everywhere
        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error saving content to Firestore:', error);
        return { success: false, error: error.message || 'Failed to save content to the database.' };
    }
}


/**
 * Saves or updates a style override for a specific page-section combination.
 * @param fullPath The full path to the style document (e.g., 'pages/home/sections/faq_styles').
 * @param styles The CSS style object to save.
 */
export async function saveStyleOverrideAction(fullPath: string, styles: any) {
    if (!fullPath || !styles) {
        return { success: false, error: 'Document path and styles are required.' };
    }

    try {
        const firestore = getAdminFirestore();
        const styleRef = firestore.doc(fullPath);
        
        await styleRef.set(styles, { merge: true });

        // Revalidate the specific page layout where the change was made
        const pathSegments = fullPath.split('/');
        const pageId = pathSegments[1]; // Assumes path is 'pages/{pageId}/...'

        if (pageId === 'home') {
            revalidatePath('/');
        } else {
            revalidatePath(`/${pageId}`);
        }
        revalidatePath('/', 'layout'); // Revalidate the whole layout too

        return { success: true };
    } catch (error: any) {
        console.error('Error saving style override to Firestore:', error);
        return { success: false, error: error.message || 'Failed to save style override.' };
    }
}

    