
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Ensures a user document exists in Firestore.
 * This is called on sign-up, first-time Google login, or first anonymous session.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null for anonymous).
 * @param isNewUser A boolean to check if it's a new user creation.
 */
export async function signUp(uid: string, email: string | null, isNewUser: boolean) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError) {
    console.error('Error in signUp server action:', adminError.message);
    return { error: adminError.message };
  }
  
  try {
    const userRef = firestore.collection('users').doc(uid);
    
    // Check if the document already exists
    const doc = await userRef.get();

    // Only create a new user document if it doesn't already exist.
    if (!doc.exists) {
      const userData: { [key: string]: any } = {
        uid,
        email,
        createdAt: FieldValue.serverTimestamp(),
        planId: 'free-default', // Assign the default free plan on creation
      };
      
      await userRef.set(userData);
      return { success: true, message: 'User record created in database.' };
    }
    
    return { success: true, message: 'User already exists, login successful.' };

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or verify user record in the database.',
    };
  }
}
