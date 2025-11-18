
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Returns an initialized Firebase Admin App instance, creating one if it doesn't exist.
 * This function is the single source of truth for server-side Firebase initialization.
 */
function getAdminApp(): App {
    // If the app is already initialized, return it.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // In a deployed environment (like App Hosting), the SDK discovers credentials automatically.
    // For local development, it relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    // If you're running locally without this set, initializeApp() will fail.
    // Ensure your local dev command is `firebase emulators:exec 'npm run dev'` to set it automatically.
    try {
        return initializeApp();
    } catch (error: any) {
        console.error(
            "Failed to auto-initialize Firebase Admin SDK. This is expected in a local environment without GOOGLE_APPLICATION_CREDENTIALS. Details: " + error.message
        );
        // This is a fallback for local development if emulators are not used.
        // It requires a serviceAccount.json file and the FIREBASE_SERVICE_ACCOUNT env var to be set.
        // It's not the recommended path but provides a fallback.
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
             console.log("Attempting to initialize with FIREBASE_SERVICE_ACCOUNT...");
             const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
             return initializeApp({
                credential: cert(serviceAccount),
             });
        }
       
        throw new Error(
            'Firebase Admin SDK initialization failed. For local development, either run your command with `firebase emulators:exec` or ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set to the path of your service account key file.'
        );
    }
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
