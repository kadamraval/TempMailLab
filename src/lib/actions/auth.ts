
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { User, Inbox } from '@/types';

/**
 * Creates or updates a user document in Firestore and optionally creates their first inbox.
 * This is an idempotent and critical action that is safe to call on every login/registration.
 * It uses `set` with `{ merge: true }` on the user doc to safely create or update it.
 *
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null if becoming registered).
 * @param isAnonymous A flag to indicate if the user is anonymous.
 * @param inboxToCreate Optional inbox data from localStorage to create upon registration.
 */
export async function signUp(
    uid: string, 
    email: string | null, 
    isAnonymous: boolean,
    inboxToCreate?: Omit<Inbox, 'id' | 'userId' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(uid);
    const docSnapshot = await userRef.get();

    const userData: Partial<User> = {
      uid,
      email: email,
      isAnonymous: isAnonymous,
    };
    
    // Only set defaults if the document is being created for the first time.
    if (!docSnapshot.exists) {
        userData.planId = 'free-default';
        userData.isAdmin = false;
        userData.createdAt = FieldValue.serverTimestamp() as any;
    }

    const batch = firestore.batch();
    
    // Operation 1: Create or update the user document.
    batch.set(userRef, userData, { merge: true });

    // Operation 2: If there's an inbox from localStorage, create it in the /inboxes collection.
    if (inboxToCreate) {
        const inboxRef = firestore.collection('inboxes').doc(); // Auto-generate ID
        batch.set(inboxRef, {
            ...inboxToCreate,
            userId: uid,
            createdAt: FieldValue.serverTimestamp(),
        });
    }
    
    // Commit both operations atomically.
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error in robust signUp server action:', error);
    // Return the specific error message to the client for better debugging.
    return {
      success: false,
      error: error.message || 'Could not create or update user record in the database.',
    };
  }
}
