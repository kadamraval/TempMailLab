
'use server';

import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';

/**
 * Creates or updates a user document in Firestore after a client-side sign-up or first-time Google login.
 * This is a server action.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email.
 * @param isNewUser A boolean to check if it's a new user creation. For Google Sign-in this is determined by creationTime and lastSignInTime.
 */
export async function signUp(uid: string, email: string | null, isNewUser: boolean) {
  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);

    if (isNewUser) {
        const userData = {
          uid,
          email,
          createdAt: new Date().toISOString(),
          planType: 'free',
          isPremium: false,
        };
        // Use setDoc with merge:false to ensure it's a new document
        await setDoc(userRef, userData, { merge: false });
        return { success: true, message: 'New user record created in database.' };
    }
    // If it's not a new user, we don't need to do anything on the database side for a standard login.
    // You could add logic here to update 'lastLogin' timestamp if needed.
    return { success: true, message: 'User already exists, login successful.'};

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or verify user record in the database.',
    };
  }
}
