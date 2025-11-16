'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';

/**
 * Creates or updates a user document in Firestore after a client-side sign-up or first-time Google login.
 * This is a server action using the Firebase Admin SDK.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email.
 * @param isNewUser A boolean to check if it's a new user creation.
 */
export async function signUp(uid: string, email: string | null, isNewUser: boolean) {
  try {
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(uid);
    const docSnap = await userRef.get();

    if (isNewUser || !docSnap.exists) {
      const userData = {
        uid,
        email,
        createdAt: new Date().toISOString(),
        planType: 'free',
        isPremium: false,
      };
      await userRef.set(userData, { merge: true });
      return { success: true, message: 'User record ensured in database.' };
    }
    
    return { success: true, message: 'User already exists, login successful.' };

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    if (error.message.includes("not configured")) {
        return { error: error.message };
    }
    return {
      error: 'Could not create or verify user record in the database.',
    };
  }
}
