
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
    // This is the primary method for production.
    try {
        console.log("Attempting to initialize Firebase Admin SDK with default credentials...");
        adminApp = initializeApp();
        console.log("Firebase Admin SDK initialized successfully.");
        return adminApp;
    } catch (error: any) {
        console.error("Firebase Admin SDK default initialization failed.", error);
        
        // This is a critical failure. The server environment is not configured correctly.
        // Throw a clear error to make this problem visible in the logs.
        const errorMessage = 'CRITICAL: Could not initialize Firebase Admin SDK. The server environment is missing Google Application Credentials. This is the root cause of server-side failures.';
        throw new Error(errorMessage);
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

