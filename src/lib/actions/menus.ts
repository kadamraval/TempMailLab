
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

export async function saveMenuAction(menuId: string, items: any[]) {
    if (!menuId || !items) {
        return { success: false, error: 'Menu ID and items are required.' };
    }

    try {
        const firestore = getAdminFirestore();
        const menuRef = firestore.doc(`menus/${menuId}`);
        
        await menuRef.set({
            id: menuId,
            items: items.map((item, index) => ({...item, order: index })),
        }, { merge: true });

        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error(`Error saving menu '${menuId}':`, error);
        return { success: false, error: error.message || `Failed to save the ${menuId} menu.` };
    }
}
