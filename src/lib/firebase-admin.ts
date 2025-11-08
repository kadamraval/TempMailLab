
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  auth: Auth;
  db: Firestore;
}

// This function ensures the Firebase Admin SDK is initialized only once.
function getFirebaseAdmin(): FirebaseAdmin {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  return { auth: admin.auth(), db: admin.firestore() };
}

export const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
