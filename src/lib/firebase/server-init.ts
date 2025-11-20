
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This function ensures the Firebase Admin app is a singleton and handles initialization correctly.
function getAdminApp(): App {
    // If there's an already initialized app, return it. This is the common case.
    const alreadyInitializedApp = getApps().find(app => app.name === '[DEFAULT]');
    if (alreadyInitializedApp) {
        return alreadyInitializedApp;
    }
    
    // If no app is initialized, proceed with the default initialization.
    // In a deployed Google Cloud environment like App Hosting, this call
    // automatically discovers the service account credentials. It does not
    // require any manual configuration or key files. This is the critical step.
    try {
        console.log("Attempting to initialize Firebase Admin SDK with default credentials...");
        const app = initializeApp();
        console.log("Firebase Admin SDK initialized successfully.");
        return app;
    } catch (error: any) {
        console.error("CRITICAL: Firebase Admin SDK default initialization failed.", error);
        // If this block runs, it signifies a fundamental problem with the hosting environment's
        // ability to provide credentials, which is highly unlikely.
        throw new Error('Could not initialize Firebase Admin SDK. The server environment is not configured correctly.');
    }
}

/**
 * Returns an initialized Firebase Admin Firestore instance.
 * It's a singleton, so it won't be re-initialized on every call.
 */
export function getAdminFirestore() {
    return getFirestore(getAdminApp());
};

/**
* Returns an initialized Firebase Admin Auth instance.
* It's a singleton, so it won't be re-initialized on every call.
*/
export function getAdminAuth() {
    return getAuth(getAdminApp());
};
