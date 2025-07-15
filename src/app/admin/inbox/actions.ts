// @/app/admin/inbox/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { firestore } from '@/lib/firebase-admin'

export async function deleteInbox(id: string) {
  if (!firestore) {
    return { success: false, error: 'Firebase not configured.' };
  }
  
  try {
    await firestore.collection('inboxes').doc(id).delete();
    revalidatePath('/admin/inbox'); // May not be needed with real-time but good practice
    return { success: true };
  } catch (error) {
    console.error('Error deleting inbox:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete inbox: ${errorMessage}` };
  }
}
