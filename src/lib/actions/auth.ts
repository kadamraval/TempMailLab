
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { Inbox } from '@/types';

/**
 * Ensures a user document exists in Firestore and optionally migrates an anonymous inbox.
 * This is a robust way to handle user creation for new sign-ups, and for
 * anonymous users transitioning to a registered account.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null for anonymous).
 * @param anonymousInbox The temporary inbox object from the user's local storage.
 */
export async function signUp(uid: string, email: string | null, anonymousInbox: Omit<Inbox, 'id'> | null = null) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError || !firestore) {
    console.error('Error in signUp server action:', adminError?.message);
    return { error: adminError?.message || 'Firestore service is not available.' };
  }
  
  try {
    const userRef = firestore.collection('users').doc(uid);
    const doc = await userRef.get();

    // Scenario 1: The user is brand new.
    if (!doc.exists) {
      // Step 1: Create the main user document FIRST. This is the critical fix.
      await userRef.set({
        uid,
        email,
        createdAt: FieldValue.serverTimestamp(),
        planId: 'free-default', // All new users start on the free plan.
        isPremium: false,
        isAdmin: false,
      });

      // Step 2: AFTER the user document is created, migrate the anonymous inbox if it exists.
      if (anonymousInbox) {
        const inboxRef = userRef.collection('inboxes').doc(); // Create a new doc in the sub-collection.
        await inboxRef.set({
          ...anonymousInbox,
          userId: uid, // Ensure the userId is the new permanent UID.
          createdAt: FieldValue.serverTimestamp() // Use a proper server timestamp.
        });
      }
      return { success: true, message: 'New user and inbox (if any) created successfully.' };
    } 
    // Scenario 2: The user already exists (e.g., a returning user logging in).
    else {
      // Even if the user exists, there might be a stray anonymous inbox to migrate.
      if (anonymousInbox) {
        const inboxRef = userRef.collection('inboxes').doc();
        await inboxRef.set({
            ...anonymousInbox,
            userId: uid,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true, message: 'Existing user logged in and inbox migrated.' };
      }
    }

    return { success: true, message: 'User record already exists.' };

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or verify user record in the database.',
    };
  }
}
