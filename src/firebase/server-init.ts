
import { initializeApp, getApps, getApp, App, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: Do not expose this to the client-side.
// This is a server-only file.
let serviceAccount: any;
try {
  serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
  serviceAccount = undefined;
}


let _app: App;
let _auth: Auth;
let _firestore: Firestore;

function initialize() {
    if (!getApps().length) {
        // Use the service account if provided, otherwise fall back to Application Default Credentials.
        // This supports both local development (with an env var) and deployed environments (like Cloud Run).
        const credential = serviceAccount ? cert(serviceAccount) : applicationDefault();
        _app = initializeApp({
            credential,
        });
    } else {
        _app = getApp();
    }
    _auth = getAuth(_app);
    _firestore = getFirestore(_app);
}

/**
 * Initializes and/or returns the server-side Firebase Admin SDK instances.
 * Ensures that initialization only happens once.
 * @returns An object containing the Firebase Admin App, Auth, and Firestore instances.
 */
export function initializeFirebase() {
    if (!_app) {
        initialize();
    }
    return { app: _app, auth: _auth, firestore: _firestore };
}
