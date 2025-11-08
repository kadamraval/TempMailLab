
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
      // When running in a Firebase or Google Cloud environment, the SDK will
      // automatically discover the service account credentials.
      admin.initializeApp();
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      throw new Error('Firebase admin initialization failed');
    }
  }
  return { adminAuth: admin.auth(), adminDb: admin.firestore() };
}
