
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This function ensures the Firebase Admin app is a singleton.
// It initializes the app only if it hasn't been initialized already.
function getAdminApp(): App {
    // If apps have already been initialized, return the existing default app.
    if (getApps().length > 0) {
        return getApps()[0];
    }
    
    // If no apps are initialized, initialize a new one.
    // Calling initializeApp() with no arguments automatically uses the
    // service account credentials from the environment (e.g., in App Hosting)
    // or from the GOOGLE_APPLICATION_CREDENTIALS environment variable locally.
    // This is the most robust and standard way to initialize.
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
