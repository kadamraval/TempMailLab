
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Returns an initialized Firebase Admin App instance, creating one if it doesn't exist.
 * This function is the single source of truth for server-side Firebase initialization.
 */
function getAdminApp(): App {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }

    // In a deployed environment (like Firebase App Hosting), the SDK discovers credentials automatically.
    // For local development, it relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    // If you're running locally without this set, the `initializeApp()` will fail.
    // Make sure your local dev command is `firebase emulators:exec 'npm run dev'` to have it set automatically.
    try {
        return initializeApp();
    } catch (error) {
        console.error("Failed to auto-initialize Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS is set for local development or you are in a managed environment.", error);
        throw new Error("Cannot initialize Firebase Admin SDK. See server logs for details.");
    }
}

/**
 * Returns an initialized Firebase Admin Firestore instance.
 */
export function getAdminFirestore() {
    return getFirestore(getAdminApp());
};
