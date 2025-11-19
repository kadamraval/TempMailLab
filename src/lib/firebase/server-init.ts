
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

// This function ensures the Firebase Admin app is a singleton.
// It initializes the app only if it hasn't been initialized already.
function getAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp!;
    }
    
    try {
        // In a deployed Google Cloud environment (like App Hosting),
        // GOOGLE_APPLICATION_CREDENTIALS are discovered automatically and `initializeApp()` works with no args.
        // Locally, you must set the GOOGLE_APPLICATION_CREDENTIALS env var to point to your service account JSON file.
        adminApp = initializeApp();
    } catch (error: any) {
        console.error("Firebase Admin initialization failed.", error);
        // Provide a more helpful error message for local development.
        if (process.env.NODE_ENV !== 'production' && error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
             throw new Error(
                'Could not initialize Firebase Admin SDK. ' +
                'Ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly in your local environment. ' +
                'For Firebase Emulators, this is often done via `firebase emulators:exec "your-dev-command"`. ' +
                'Original Error: ' + error.message
            );
        }
        throw error;
    }
    
    return adminApp!;
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
