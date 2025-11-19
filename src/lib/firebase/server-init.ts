
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

// This function ensures the Firebase Admin app is a singleton and handles initialization correctly.
function getAdminApp(): App {
    // If the app is already initialized, return it to prevent re-initialization.
    if (adminApp) {
        return adminApp;
    }

    // In many environments (including local if GOOGLE_APPLICATION_CREDENTIALS is set),
    // getApps() will find an already initialized app.
    const alreadyInitializedApp = getApps().find(app => app.name === '[DEFAULT]');
    if (alreadyInitializedApp) {
        adminApp = alreadyInitializedApp;
        return adminApp;
    }
    
    // If no app is initialized, proceed with initialization.
    // In a deployed Google Cloud environment (like App Hosting or Cloud Run), 
    // service account credentials should be automatically discovered.
    // Locally, you must set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    try {
        console.log("Attempting to initialize Firebase Admin SDK...");
        adminApp = initializeApp();
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization failed.", error);
        
        // Provide a more helpful error message for different environments.
        if (error.code === 'app/invalid-credential') {
             const errorMessage = 'Could not initialize Firebase Admin SDK. This is a critical failure. In a local environment, ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable points to your service account JSON file. In a deployed environment, this indicates a problem with the service account permissions.';
             throw new Error(errorMessage);
        }
        // For other errors, re-throw the original error.
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
