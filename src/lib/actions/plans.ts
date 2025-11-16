'use server';

import { initializeFirebaseAdmin } from '@/firebase/server-init';
import { revalidatePath } from 'next/cache';

/**
 * Deletes a plan document from Firestore using the Admin SDK.
 * @param planId The ID of the plan document to delete.
 */
export async function deletePlanAction(planId: string) {
  if (!planId) {
    return { error: 'Plan ID is required.' };
  }

  try {
    const { firestore } = await initializeFirebaseAdmin();
    const planRef = firestore.collection('plans').doc(planId);
    
    await planRef.delete();

    // Revalidate the path to ensure the UI updates after the deletion.
    revalidatePath('/admin/packages');

    return { success: true, message: 'Plan deleted successfully.' };
  } catch (error: any) {
    console.error('Error in deletePlanAction:', error);
    if (error.message.includes("not configured")) {
        return { error: error.message };
    }
    return {
      error: 'Could not delete the plan from the database.',
    };
  }
}
