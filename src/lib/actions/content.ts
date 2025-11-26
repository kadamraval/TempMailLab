
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { FieldValue, WriteBatch } from 'firebase-admin/firestore';

/**
 * Saves or updates content for a specific section on a specific page.
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
        
        const docSnap = await contentRef.get();
        if (!docSnap.exists) {
            data.createdAt = FieldValue.serverTimestamp();
        }
        data.updatedAt = FieldValue.serverTimestamp();
        
        await contentRef.set(data, { merge: true });

        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error saving content to Firestore:', error);
        return { success: false, error: error.message || 'Failed to save content to the database.' };
    }
}


/**
 * Saves or updates a style override for a specific page-section combination.
 * @param fullPath The full path to the style override document (e.g., 'pages/home/sections/faq_styles').
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
        
        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error saving style override to Firestore:', error);
        return { success: false, error: error.message || 'Failed to save style override.' };
    }
}


/**
 * Updates the order or existence of sections on a page.
 * @param pageId The ID of the page being edited.
 * @param sections An array of section objects, which could include new sections to add.
 */
export async function savePageSectionsAction(pageId: string, sections: { id: string, name?: string, order: number, hidden?: boolean }[]) {
    if (!pageId || !sections) {
        return { success: false, error: 'Page ID and sections data are required.' };
    }
    
    try {
        const firestore = getAdminFirestore();
        const batch: WriteBatch = firestore.batch();
        const pageSectionsCollection = firestore.collection(`pages/${pageId}/sections`);
        
        sections.forEach(section => {
            const sectionRef = pageSectionsCollection.doc(section.id);
            const dataToSet: any = {
                id: section.id,
                name: section.name || section.id, // Fallback to id if name is missing
                order: section.order,
            };
            // Only set 'hidden' if it's explicitly provided, otherwise leave it untouched
            if (section.hidden !== undefined) {
                dataToSet.hidden = section.hidden;
            }

            batch.set(sectionRef, dataToSet, { merge: true });
        });

        await batch.commit();

        revalidatePath('/', 'layout');
        return { success: true };

    } catch (error: any) {
        console.error('Error saving page sections to Firestore:', error);
        return { success: false, error: error.message || 'Failed to save page sections.' };
    }
}
