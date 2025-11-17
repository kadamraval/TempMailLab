'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/firebase/server-init';

/**
 * Saves a plan to Firestore. Handles both creating a new plan and updating an existing one.
 * @param planData The data for the plan.
 * @param planId Optional ID of the plan to update. If not provided, a new plan is created.
 * @returns An object indicating success or an error message.
 */
export async function savePlanAction(planData: any, planId?: string) {
    try {
        const firestore = getAdminFirestore();
        if (planId) {
            // Update existing plan
            const planRef = firestore.doc(`plans/${planId}`);
            await planRef.update(planData);
        } else {
            // Create new plan
            const collectionRef = firestore.collection("plans");
            await collectionRef.add({
                ...planData,
                createdAt: new Date(),
            });
        }
        
        // Revalidate the admin path to show the updated plan list
        revalidatePath('/admin/packages');
        return { success: true };

    } catch (error: any) {
        return { error: error.message || 'An unknown error occurred.' };
    }
}


/**
 * Deletes a plan from Firestore.
 * @param planId The ID of the plan to delete.
 * @returns An object indicating success or an error message.
 */
export async function deletePlanAction(planId: string) {
    try {
        if (!planId) {
            throw new Error("Plan ID is required for deletion.");
        }
        
        const firestore = getAdminFirestore();
        const planRef = firestore.doc(`plans/${planId}`);
        await planRef.delete();

        // Revalidate the admin path to show the updated plan list
        revalidatePath('/admin/packages');
        return { success: true };

    } catch (error: any) {
        return { error: error.message || 'An unknown error occurred.' };
    }
}
