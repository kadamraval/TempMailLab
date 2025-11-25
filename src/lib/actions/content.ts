
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

/**
 * Saves or updates content for a specific section in Firestore.
 * @param sectionId The unique identifier for the content section (e.g., 'faq', 'features').
 * @param data The content data object to save.
 */
export async function saveContentAction(sectionId: string, data: any) {
    if (!sectionId || !data) {
        return { success: false, error: 'Section ID and data are required.' };
    }

    try {
        const firestore = getAdminFirestore();
        const contentRef = firestore.collection('page_content').doc(sectionId);
        
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
 * @param overrideId The unique ID for the override (e.g., 'home_faq').
 * @param styles The CSS style object to save.
 */
export async function saveStyleOverrideAction(overrideId: string, styles: any) {
    if (!overrideId || !styles) {
        return { success: false, error: 'Override ID and styles are required.' };
    }

    try {
        const firestore = getAdminFirestore();
        const styleRef = firestore.collection('page_style_overrides').doc(overrideId);
        
        await styleRef.set(styles, { merge: true });

        // Revalidate the specific page layout where the change was made
        const pageId = overrideId.split('_')[0];
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

    