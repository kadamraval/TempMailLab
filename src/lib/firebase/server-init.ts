import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This function ensures the Firebase Admin app is a singleton.
// It initializes the app only if it hasn't been initialized already.
function getAdminApp(): App {
    // If an app is already initialized, return it.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // In a deployed Google Cloud environment (like App Hosting),
    // GOOGLE_APPLICATION_CREDENTIALS is set automatically.
    // Locally, you must set this environment variable to point to your service account JSON file.
    // `initializeApp()` with no arguments will use these credentials.
    return initializeApp();
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
