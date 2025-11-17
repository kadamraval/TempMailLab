
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';

/**
 * Ensures a user document exists in Firestore.
 * This is called on sign-up, first-time Google login, or first anonymous session.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param email The user's email (can be null for anonymous).
 * @param isNewUser A boolean to check if it's a new user creation.
 * @param anonymousInbox An optional anonymous inbox to migrate.
 */
export async function signUp(uid: string, email: string | null, isNewUser: boolean, anonymousInbox?: any) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError) {
    console.error('Error in signUp server action:', adminError.message);
    return { error: adminError.message };
  }
  
  try {
    const userRef = firestore.collection('users').doc(uid);
    
    // Only create a new user document if it is genuinely a new user.
    if (isNewUser) {
      const userData: { [key: string]: any } = {
        uid,
        email,
        createdAt: new Date().toISOString(),
        // Assign the default free plan on creation
        planId: 'free-default', 
      };
      
      await userRef.set(userData);

      // If there's an anonymous inbox to migrate, create it in the new user's sub-collection.
      if (anonymousInbox?.emailAddress) {
        const inboxRef = userRef.collection('inboxes').doc(); // Auto-generate ID
        await inboxRef.set({
          ...anonymousInbox,
          userId: uid // Associate with the new user
        });
      }

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
