
'use server';

import { setDocumentNonBlocking } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';

/**
 * Creates a user document in Firestore after client-side registration.
 * This is a server action.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email.
 */
export async function signUp(uid: string, email: string) {
  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);

    const userData = {
      uid,
      email,
      createdAt: new Date().toISOString(),
      planType: 'free',
      isPremium: false,
    };
    
    // Use the non-blocking firestore update
    setDocumentNonBlocking(userRef, userData, { merge: false });

    return { success: true };
  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create user record in the database.',
    };
  }
}
