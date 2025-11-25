
import { initializeApp, getApps, App, applicationDefault, cert } from 'firebase-admin/app';
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

    if (getApps().length > 0) {
        firebaseGlobal.firebaseAdminApp = getApps()[0];
        return firebaseGlobal.firebaseAdminApp;
    }
    
    // This is the most direct approach. If the environment is configured correctly,
    // applicationDefault() should work. If not, the previous attempts have shown
    // that manually parsing env vars is also failing. This simplifies the logic
    // to the standard expected behavior.
    firebaseGlobal.firebaseAdminApp = initializeApp({
        credential: applicationDefault(),
    });

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
