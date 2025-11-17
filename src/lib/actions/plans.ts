'use server';

import { revalidatePath } from 'next/cache';
import { initializeFirebase } from '@/firebase/server-init';
import { addDoc, collection, doc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";

// This file was incorrectly deleted. It is being restored to fix build errors.
// It provides server actions for managing subscription plans.

/**
 * Saves a plan to Firestore. Handles both creating a new plan and updating an existing one.
 * @param planData The data for the plan.
 * @param planId Optional ID of the plan to update. If not provided, a new plan is created.
 * @returns An object indicating success or an error message.
 */
export async function savePlanAction(planData: any, planId?: string) {
    try {
        const { firestore } = initializeFirebase();
        if (planId) {
            // Update existing plan
            const planRef = doc(firestore, "plans", planId);
            await updateDoc(planRef, planData);
        } else {
            // Create new plan
            const collectionRef = collection(firestore, "plans");
            await addDoc(collectionRef, {
                ...planData,
                createdAt: serverTimestamp(),
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
        const { firestore } = initializeFirebase();
        if (!planId) {
            throw new Error("Plan ID is required for deletion.");
        }
        
        const planRef = doc(firestore, "plans", planId);
        await deleteDoc(planRef);

        // Revalidate the admin path to show the updated plan list
        revalidatePath('/admin/packages');
        return { success: true };

    } catch (error: any) {
        return { error: error.message || 'An unknown error occurred.' };
    }
}
