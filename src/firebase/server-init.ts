import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// This file is the single source of truth for initializing the Firebase Admin SDK.
// It ensures the app is only initialized once.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const adminApp: App = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : undefined,
    });


/**
 * Returns an initialized Firebase Admin Auth instance.
 * Call this function within server actions or API routes.
 */
export function getAdminAuth(): Auth {
    return getAuth(adminApp);
}

/**
 * Returns an initialized Firebase Admin Firestore instance.
 * Call this function within server actions or API routes.
 */
export function getAdminFirestore(): Firestore {
    return getFirestore(adminApp);
}
