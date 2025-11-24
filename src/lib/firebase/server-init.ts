
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Define a type for the global object to avoid TypeScript errors
// and ensure we're not polluting the global scope unintentionally.
interface FirebaseAdminGlobal {
    firebaseAdminApp?: App;
    firestore?: Firestore;
    auth?: Auth;
}

// Cast `globalThis` to our new type.
const firebaseGlobal = globalThis as FirebaseAdminGlobal;

/**
 * Initializes the Firebase Admin SDK, ensuring it's a singleton.
 * This pattern prevents re-initialization in hot-reload environments (like Next.js dev mode).
 */
function initializeAdminApp() {
    // If the app is already initialized, just return its services.
    if (firebaseGlobal.firebaseAdminApp) {
        return {
            app: firebaseGlobal.firebaseAdminApp,
            firestore: firebaseGlobal.firestore!,
            auth: firebaseGlobal.auth!,
        };
    }
    
    // If there are existing apps, use the first one. This can happen in some environments.
    const apps = getApps();
    if (apps.length > 0) {
        firebaseGlobal.firebaseAdminApp = apps[0];
    } else {
        // No apps initialized, so create a new one.
        // When running on Google Cloud (like Firebase App Hosting), GOOGLE_APPLICATION_CREDENTIALS
        // is automatically set. credential.applicationDefault() uses this.
        // For local development, you must set this environment variable to point to your service account key file.
        firebaseGlobal.firebaseAdminApp = initializeApp({
            credential: applicationDefault(),
        });
    }

    firebaseGlobal.firestore = getFirestore(firebaseGlobal.firebaseAdminApp);
    firebaseGlobal.auth = getAuth(firebaseGlobal.firebaseAdminApp);

    return {
        app: firebaseGlobal.firebaseAdminApp,
        firestore: firebaseGlobal.firestore,
        auth: firebaseGlobal.auth,
    };
}

// Initialize on module load.
const { firestore, auth } = initializeAdminApp();

export function getAdminFirestore(): Firestore {
  return firestore;
}

export function getAdminAuth(): Auth {
  return auth;
}
