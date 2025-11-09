
'use server';

import { doc, getFirestore, setDoc, getDoc } from 'firebase/firestore';
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

    // For Google Sign-in, isNewUser is reliable.
    // For email/pass, we might want to double-check if the doc exists
    // to handle cases where client-side creation failed.
    const docSnap = await getDoc(userRef);

    if (isNewUser || !docSnap.exists()) {
        const userData = {
          uid,
          email,
          createdAt: new Date().toISOString(),
          planType: 'free',
          isPremium: false,
        };
        await setDoc(userRef, userData, { merge: true });
        return { success: true, message: 'User record ensured in database.' };
    }
    
    return { success: true, message: 'User already exists, login successful.'};

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or verify user record in the database.',
    };
  }
}
