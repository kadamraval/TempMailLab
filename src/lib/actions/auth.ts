
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { User } from '@/types';

/**
 * Creates or updates a user document in Firestore. This is an idempotent and critical action.
 * It uses `set` with `{ merge: true }` to safely create the document if it doesn't exist,
 * or update it if it does (e.g., changing from anonymous to registered).
 * This is the primary function for ensuring a user record exists in the database.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null for anonymous users).
 * @param isAnonymous A flag to indicate if the user is anonymous.
 */
export async function signUp(uid: string, email: string | null, isAnonymous: boolean): Promise<{ success: boolean; error?: string }> {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError || !firestore) {
    const errorMsg = adminError?.message || 'Firestore service is not available.';
    console.error('Error in signUp server action:', errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    const userRef = firestore.collection('users').doc(uid);
    const docSnapshot = await userRef.get();

    const userData: Partial<User> = {
      uid,
      email: email, // This will be null for anon, and set for registered
      isAnonymous: isAnonymous,
    };
    
    // If the document doesn't exist, it's a completely new user (anonymous or direct register).
    // Set their defaults. This is the only time these fields are set.
    if (!docSnapshot.exists) {
        userData.planId = 'free-default';
        userData.isAdmin = false;
        userData.createdAt = FieldValue.serverTimestamp() as any;
    }

    // Use set with merge: true. This is the key to robust user creation.
    // - If doc doesn't exist, it's CREATED with all userData fields.
    // - If doc exists (e.g., an anonymous user registering), it's UPDATED with the new email and isAnonymous status, leaving other fields untouched.
    await userRef.set(userData, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error in robust signUp server action:', error);
    return {
      success: false,
      error: 'Could not create or update user record in the database.',
    };
  }
}


/**
 * Migrates a single anonymous inbox to a registered user by updating its userId field.
 * This is a separate, dedicated action for clarity and reliability.
 * @param inboxId The ID of the inbox in the top-level /inboxes collection.
 * @param newUserId The new (or final) registered user ID.
 */
export async function migrateAnonymousInbox(inboxId: string, newUserId: string): Promise<{ success: boolean; error?: string }> {
    const { firestore, error: adminError } = getFirebaseAdmin();
    if (adminError || !firestore) {
        const errorMsg = adminError?.message || 'Firestore service is not available.';
        console.error('Error in migrateAnonymousInbox server action:', errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const inboxRef = firestore.collection('inboxes').doc(inboxId);
        await inboxRef.update({ userId: newUserId });
        return { success: true };
    } catch (error: any) {
        console.error(`Error migrating inbox ${inboxId}:`, error);
        return { success: false, error: `Failed to migrate inbox ${inboxId}.` };
    }
}
