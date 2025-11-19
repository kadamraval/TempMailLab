
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

// This function ensures the Firebase Admin app is a singleton.
function getAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    const alreadyInitializedApp = getApps().find(app => app.name === '[DEFAULT]');
    if (alreadyInitializedApp) {
        adminApp = alreadyInitializedApp;
        return adminApp;
    }
    
    // In a deployed Google Cloud environment (like App Hosting), service account credentials
    // are automatically discovered. Locally, you must set the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable to point to your service account JSON file.
    try {
        adminApp = initializeApp();
    } catch (error: any) {
        console.error("Firebase Admin initialization failed.", error);
        // Provide a more helpful error message for local development.
        if (process.env.NODE_ENV !== 'production' && error.code === 'app/invalid-credential') {
             throw new Error(
                'Could not initialize Firebase Admin SDK. ' +
                'Ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly in your local environment. ' +
                'This file should point to your service account JSON key. ' +
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
