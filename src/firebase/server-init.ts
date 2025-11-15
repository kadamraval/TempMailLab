
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: Do not expose this to the client-side.
// This is a server-only file.

let _app: App | undefined;
let _auth: Auth | undefined;
let _firestore: Firestore | undefined;

function initializeAdminSDK() {
    if (getApps().length) {
        _app = getApp();
        _auth = getAuth(_app);
        _firestore = getFirestore(_app);
        return;
    }

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            _app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            // This is a fallback for environments where ADC are configured (like Cloud Run)
            // It will fail in a standard local dev environment if GOOGLE_APPLICATION_CREDENTIALS is not set.
            console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT env var not set. Falling back to Application Default Credentials. This might fail if not configured.");
            _app = initializeApp();
        }
        
        _auth = getAuth(_app);
        _firestore = getFirestore(_app);

    } catch (error: any) {
        console.error("FATAL: Firebase Admin SDK initialization failed.", error);
        // We set the instances to undefined so functions using them can fail gracefully.
        _app = undefined;
        _auth = undefined;
        _firestore = undefined;
    }
}


/**
 * Initializes and/or returns the server-side Firebase Admin SDK instances.
 * Ensures that initialization only happens once.
 * @returns An object containing the Firebase Admin App, Auth, and Firestore instances.
 * @throws {Error} If the SDK could not be initialized.
 */
export function initializeFirebase() {
    if (!_app) {
        initializeAdminSDK();
    }
    
    if (!_app || !_auth || !_firestore) {
         throw new Error("Firebase Admin SDK is not available. Initialization likely failed. Check server logs for details.");
    }
    
    return { app: _app, auth: _auth, firestore: _firestore };
}
