import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// IMPORTANT: This file should only ever be imported in server-side code.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let firebaseAdminApp: App;
if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
  });
} else {
  firebaseAdminApp = getApp();
}

const firestore: Firestore = getFirestore(firebaseAdminApp);
const auth: Auth = getAuth(firebaseAdminApp);

export function initializeFirebase() {
  return { firebaseAdminApp, auth, firestore };
}
