
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';

/**
 * Deletes a plan from Firestore.
 * This is a server action using the Firebase Admin SDK.
 * It includes a safeguard to prevent deletion of the critical 'free-default' plan.
 * @param planId The ID of the plan document to delete.
 */
export async function deletePlanAction(planId: string) {
  if (planId === 'free-default') {
    return { error: "The default 'Free' plan is a system plan and cannot be deleted." };
  }

  try {
    const { firestore } = getFirebaseAdmin();
    const planRef = firestore.collection('plans').doc(planId);
    await planRef.delete();
    
    return { success: true, message: 'Plan deleted successfully.' };

  } catch (error: any) {
    console.error('Error in deletePlanAction server action:', error);
    return {
      error: 'Could not delete the plan from the database.',
    };
  }
}
