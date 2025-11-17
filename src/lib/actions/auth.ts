
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

    if (!doc.exists) {
      // User does not exist. Create their user document FIRST.
      const userData = {
        uid,
        email,
        createdAt: FieldValue.serverTimestamp(),
        planId: 'free-default', // All new users start on the free plan
        isPremium: false,
        isAdmin: false,
      };
      
      // This is the critical step: create the main document before doing anything else.
      await userRef.set(userData);

      // AFTER creating the user, migrate the inbox if it exists.
      if (anonymousInbox) {
        const inboxRef = userRef.collection('inboxes').doc();
        await inboxRef.set({
          ...anonymousInbox,
          userId: uid, // Ensure the userId is the new permanent UID
          createdAt: FieldValue.serverTimestamp() // Use a proper server timestamp
        });
      }

      return { success: true, message: 'User record created and inbox migrated.' };
    } else {
        // User already exists. This can happen if they log in.
        // Still check if we need to migrate an anonymous inbox.
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
