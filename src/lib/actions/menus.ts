
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { WriteBatch, doc } from 'firebase/firestore';

// Note: This function no longer commits the batch itself.
export function saveMenuAction(batch: WriteBatch, menuId: string, items: any[]) {
    if (!menuId || !items) {
        // In a batched transaction, we might prefer to throw an error
        // or handle it in the calling function.
        console.warn(`Skipping menu save for ${menuId} due to missing data.`);
        return;
    }
    
    const firestore = getAdminFirestore();
    const menuRef = firestore.doc(`menus/${menuId}`);
    
    batch.set(menuRef, {
        id: menuId,
        items: items.map((item, index) => ({
            id: item.id,
            label: item.label,
            href: item.href,
            order: index
        })),
    }, { merge: true });

    revalidatePath('/', 'layout');
}


export async function updateMenuLabelsAction(pageId: string, newLabel: string) {
    if (!pageId || !newLabel) return;
    
    try {
        const firestore = getAdminFirestore();
        const menusRef = firestore.collection('menus');
        const menusSnapshot = await menusRef.get();

        if (menusSnapshot.empty) return;
        
        const batch = firestore.batch();

        menusSnapshot.forEach(menuDoc => {
            const menuData = menuDoc.data();
            let hasChanged = false;
            
            const updatedItems = menuData.items.map((item: any) => {
                if (item.id === pageId && item.label !== newLabel) {
                    hasChanged = true;
                    return { ...item, label: newLabel };
                }
                return item;
            });
            
            if (hasChanged) {
                batch.update(menuDoc.ref, { items: updatedItems });
            }
        });
        
        await batch.commit();
        revalidatePath('/', 'layout');
        
    } catch(e) {
        console.error("Error updating menu labels:", e);
    }
}
