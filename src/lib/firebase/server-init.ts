
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

// This function ensures the Firebase Admin app is a singleton.
function getAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    // Check if the app is already initialized, which can happen in some environments.
    const alreadyInitializedApp = getApps().find(app => app.name === '[DEFAULT]');
    if (alreadyInitializedApp) {
        adminApp = alreadyInitializedApp;
        return adminApp;
    }
    
    // In a deployed Google Cloud environment (like App Hosting or Cloud Run), 
    // service account credentials are automatically discovered via the metadata server.
    // Locally, you must set the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // to point to your service account JSON file.
    try {
        adminApp = initializeApp();
    } catch (error: any) {
        console.error("Firebase Admin initialization failed.", error);
        
        // Provide a more helpful error message for local development.
        if (process.env.NODE_ENV !== 'production' && error.code === 'app/invalid-credential') {
             throw new Error(
                'Could not initialize Firebase Admin SDK. ' +
                'This is likely because the GOOGLE_APPLICATION_CREDENTIALS environment variable is not set correctly in your local environment. ' +
                'The variable should point to your service account JSON key file. ' +
                'Original Error: ' + error.message
            );
        }
        // For production, re-throw the original error.
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
