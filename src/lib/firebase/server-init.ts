
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Define a type for the global object to avoid TypeScript errors
// and ensure we're not polluting the global scope unintentionally.
interface FirebaseAdminGlobal {
    firebaseAdminApp?: App;
}

// Cast `globalThis` to our new type.
const firebaseGlobal = globalThis as FirebaseAdminGlobal;

/**
 * Initializes the Firebase Admin SDK, ensuring it's a singleton.
 * This pattern prevents re-initialization in hot-reload environments (like Next.js dev mode).
 */
function initializeAdminApp() {
    if (firebaseGlobal.firebaseAdminApp) {
        return firebaseGlobal.firebaseAdminApp;
    }

    // If there are already apps, it might be due to hot-reloading.
    // Use the first initialized app.
    if (getApps().length > 0) {
        firebaseGlobal.firebaseAdminApp = getApps()[0];
        return firebaseGlobal.firebaseAdminApp;
    }
    
    // In a configured Google Cloud environment (like App Hosting or Cloud Functions),
    // initializeApp() without arguments will use the project's default credentials.
    // This is the simplest and most robust method for deployed environments.
    firebaseGlobal.firebaseAdminApp = initializeApp();

    return firebaseGlobal.firebaseAdminApp;
}

// Initialize on module load.
const adminApp = initializeAdminApp();

export function getAdminFirestore(): Firestore {
  return getFirestore(adminApp);
}

export function getAdminAuth(): Auth {
  return getAuth(adminApp);
}
