
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  auth: Auth;
  db: Firestore;
}

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const adminAuth: Auth = admin.auth();
const adminDb: Firestore = admin.firestore();

export { adminAuth, adminDb };
