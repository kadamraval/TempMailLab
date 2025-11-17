
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// This file is intended for server-side Firebase Admin initialization.
// By centralizing it, we can ensure consistent initialization logic.
// Server actions should import what they need directly from 'firebase-admin'
// and initialize the app themselves to avoid bundling issues.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

function getAdminApp(): App {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
    });
}

export function getAdminAuth(): Auth {
    return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}
