
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { Inbox, User } from '@/types';

/**
 * Ensures a user document exists in Firestore. This is a robust, idempotent action.
 * It uses set with merge:true to create the document if it doesn't exist, or
 * harmlessly update it if it does. This guarantees a record exists for any authenticated user.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null for anonymous users).
 * @param isAnonymous A flag to indicate if the user is anonymous.
 */
export async function signUp(uid: string, email: string | null, isAnonymous: boolean) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError || !firestore) {
    const errorMsg = adminError?.message || 'Firestore service is not available.';
    console.error('Error in signUp server action:', errorMsg);
    return { error: errorMsg };
  }
  
  try {
    const userRef = firestore.collection('users').doc(uid);

    const docSnapshot = await userRef.get();
    
    // Only write if the document does not exist to avoid overwriting existing data
    if (!docSnapshot.exists) {
        const userData: Omit<User, 'createdAt'> = {
            uid,
            email: email,
            planId: 'free-default', // All users start on the free plan.
            isAnonymous: isAnonymous,
            isAdmin: false,
        };
        
        await userRef.set({
            ...userData,
            createdAt: FieldValue.serverTimestamp(),
        });
    } else {
        // If the user exists but is transitioning from anonymous, update the flag.
        if (docSnapshot.data()?.isAnonymous && !isAnonymous) {
            await userRef.update({
                isAnonymous: false,
                email: email, // Update email on upgrade
            });
        }
    }

    return { success: true, message: 'User record ensured in database.' };

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or update user record in the database.',
    };
  }
}
