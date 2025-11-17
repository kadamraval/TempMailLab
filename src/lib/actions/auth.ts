
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Ensures a user document exists in Firestore. If it doesn't exist, it creates one.
 * This is a robust way to handle user creation for both new sign-ups and first-time
 * anonymous or social logins.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null for anonymous).
 */
export async function signUp(uid: string, email: string | null) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError || !firestore) {
    console.error('Error in signUp server action:', adminError?.message);
    return { error: adminError?.message || 'Firestore service is not available.' };
  }
  
  try {
    const userRef = firestore.collection('users').doc(uid);
    const doc = await userRef.get();

    // If the user document does NOT exist, create it.
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
    
    // If the document already exists, do nothing.
    return { success: true, message: 'User record already exists.' };

  } catch (error: any) {
    console.error('Error in signUp server action:', error);
    return {
      error: 'Could not create or verify user record in the database.',
    };
  }
}
