
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { User } from '@/types';

/**
 * Ensures a user document exists in Firestore. This is a robust, idempotent action.
 * It uses set with merge:true to create the document if it doesn't exist, or
 * harmlessly update it if it does. This is the primary function for user creation.
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
      email,
      isAnonymous,
    };
    
    // If the document doesn't exist, it's a brand new user (anonymous or registered).
    // Set their defaults.
    if (!docSnapshot.exists) {
        userData.planId = 'free-default';
        userData.isAdmin = false;
        userData.createdAt = FieldValue.serverTimestamp() as any;
    }

    // Use set with merge: true. This is the key change.
    // It creates the doc if it's new, or safely merges the new properties
    // (like email and isAnonymous: false) if it's an existing anonymous user.
    await userRef.set(userData, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      success: false,
      error: 'Could not create or update user record in the database.',
    };
  }
}

/**
 * Migrates a single anonymous inbox to a registered user by updating its userId field.
 * @param anonymousUserId The original anonymous user ID.
 * @param registeredUserId The new (or final) registered user ID.
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
