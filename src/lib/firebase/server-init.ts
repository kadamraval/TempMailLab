
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
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

    // This is the key change: We check for the service account environment variable.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount: ServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            firebaseGlobal.firebaseAdminApp = initializeApp({
                credential: cert(serviceAccount)
            });
            return firebaseGlobal.firebaseAdminApp;
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
        }
    }
    
    // In a configured Google Cloud environment (like App Hosting or Cloud Functions),
    // initializeApp() without arguments will use the project's default credentials.
    // This is the fallback for the live environment.
    if (getApps().length === 0) {
        firebaseGlobal.firebaseAdminApp = initializeApp();
    } else {
        firebaseGlobal.firebaseAdminApp = getApps()[0];
    }

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
