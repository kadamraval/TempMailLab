
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  adminAuth: Auth;
  adminDb: Firestore;
}

// This function ensures the Firebase Admin SDK is initialized only once.
export function getFirebaseAdmin(): FirebaseAdmin {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      // We re-throw the error to make it clear that something is critically wrong.
      throw new Error('Firebase admin initialization failed');
    }
  }
  return { adminAuth: admin.auth(), adminDb: admin.firestore() };
}
