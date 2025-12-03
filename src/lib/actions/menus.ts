
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

export async function saveAllMenusAction(menus: { [key: string]: any[] }) {
    try {
        const firestore = getAdminFirestore();
        const batch = firestore.batch();

        for (const menuId in menus) {
            const items = menus[menuId];
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
        }
        
        await batch.commit();

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error("Error saving menus:", error);
        return { success: false, error: error.message || "Failed to save menus." };
    }
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
