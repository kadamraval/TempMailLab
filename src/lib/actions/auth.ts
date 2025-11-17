
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { Inbox } from '@/types';

/**
 * Ensures a user document exists in Firestore.
 * This is an idempotent action that creates or merges the user document,
 * guaranteeing a record exists for any authenticated user.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null).
 */
export async function signUp(uid: string, email: string | null) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError || !firestore) {
    const errorMsg = adminError?.message || 'Firestore service is not available.';
    console.error('Error in signUp server action:', errorMsg);
    return { error: errorMsg };
  }
  
  try {
    const userRef = firestore.collection('users').doc(uid);

    // Use set with merge:true. This is idempotent.
    // If the doc doesn't exist, it's created.
    // If it exists, it merges the fields (harmlessly updating email if it changed).
    await userRef.set({
        uid,
        email,
        createdAt: FieldValue.serverTimestamp(),
        planId: 'free-default', // All new users start on the free plan.
        isPremium: false,
        isAdmin: false,
      }, { merge: true });

    return { success: true, message: 'User record ensured in database.' };

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or update user record in the database.',
    };
  }
}


/**
 * Migrates an anonymous inbox to a registered user's account.
 * This should be called AFTER the user has been successfully created.
 * @param uid The user's unique ID.
 * @param anonymousInbox The temporary inbox object from local storage.
 */
export async function migrateAnonymousInbox(uid: string, anonymousInbox: Omit<Inbox, 'id'>) {
    const { firestore, error: adminError } = getFirebaseAdmin();

    if (adminError || !firestore) {
      const errorMsg = adminError?.message || 'Firestore service is not available.';
      console.error('Error in migrateAnonymousInbox server action:', errorMsg);
      return { error: errorMsg };
    }

    if (!uid || !anonymousInbox) {
        return { error: 'User ID and inbox data are required for migration.' };
    }

    try {
        const userRef = firestore.collection('users').doc(uid);
        const inboxRef = userRef.collection('inboxes').doc(); // Create a new doc in the sub-collection.
        
        await inboxRef.set({
          ...anonymousInbox,
          userId: uid, // Ensure the userId is the new permanent UID.
          createdAt: FieldValue.serverTimestamp() // Use a proper server timestamp.
        });

        return { success: true, message: 'Inbox migrated successfully.' };

    } catch (error: any) {
        console.error('Error migrating inbox:', error);
        return { error: 'Could not migrate anonymous inbox.' };
    }
}
