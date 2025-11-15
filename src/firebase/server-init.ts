
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: Do not expose this to the client-side.
// This is a server-only file.
let serviceAccount: any;
try {
  // This environment variable is now required for server-side operations.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Throw an error if the service account is not provided. This makes the dependency explicit.
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set. Server-side Firebase Admin SDK cannot be initialized.");
  }
} catch (error) {
  console.error("FATAL: Failed to parse FIREBASE_SERVICE_ACCOUNT or it is not set.", error);
  // To prevent the app from running with a broken server-side config, we re-throw.
  throw error;
}


let _app: App;
let _auth: Auth;
let _firestore: Firestore;

function initialize() {
    if (!getApps().length) {
        _app = initializeApp({
            credential: cert(serviceAccount),
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
