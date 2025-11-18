
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

/**
 * Initializes and returns the Firebase Admin App instance, ensuring it's a singleton.
 * This function is the single source of truth for server-side Firebase initialization.
 * It uses default credentials which work in App Hosting and with GOOGLE_APPLICATION_CREDENTIALS locally.
 */
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // initializeApp() with no arguments will use the default credentials
    // provided by the environment (App Hosting or local GOOGLE_APPLICATION_CREDENTIALS).
    // This is the most robust and recommended approach.
    try {
        adminApp = initializeApp();
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization failed:", error);
        throw new Error(
            'Firebase Admin SDK initialization failed. Ensure your server environment is configured with the correct credentials. For local development, use `firebase emulators:exec` or set the GOOGLE_APPLICATION_CREDENTIALS environment variable.'
        );
    }
    return adminApp;
}

/**
 * Returns an initialized Firebase Admin Firestore instance.
 */
export function getAdminFirestore() {
    return getFirestore(getAdminApp());
};

/**
* Returns an initialized Firebase Admin Auth instance.
*/
export function getAdminAuth() {
    return getAuth(getAdminApp());
};
