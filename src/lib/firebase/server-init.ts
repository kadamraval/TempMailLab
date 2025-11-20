
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Define a type for the global object to avoid TypeScript errors
interface GlobalWithFirebase extends NodeJS.Global {
    _firebaseAdminApp?: App;
    _firestore?: Firestore;
    _auth?: Auth;
}

// Use a cast to tell TypeScript about our custom global properties
const globalWithFirebase = global as GlobalWithFirebase;

/**
 * Initializes the Firebase Admin SDK, ensuring it's a singleton.
 * This pattern prevents re-initialization in hot-reload environments (like Next.js dev mode).
 */
function initializeAdmin() {
    if (globalWithFirebase._firebaseAdminApp) {
        return; // Already initialized
    }

    const apps = getApps();
    if (apps.length > 0) {
        globalWithFirebase._firebaseAdminApp = apps[0] as App;
    } else {
        // When running on Google Cloud (like Firebase App Hosting), GOOGLE_APPLICATION_CREDENTIALS
        // is automatically set. credential.applicationDefault() uses this.
        // For local development, you must set this environment variable to point to your service account key file.
        const cred = credential.applicationDefault();
        globalWithFirebase._firebaseAdminApp = initializeApp({
            credential: cred,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tempinbox-525dm', // Fallback for safety
        });
    }

    globalWithFirebase._firestore = getFirestore(globalWithFirebase._firebaseAdminApp);
    globalWithFirebase._auth = getAuth(globalWithFirebase._firebaseAdminApp);
}

// Initialize on module load
initializeAdmin();

export function getAdminFirestore(): Firestore {
  if (!globalWithFirebase._firestore) {
    // This should technically not be reached if initializeAdmin is called correctly
    initializeAdmin();
  }
  return globalWithFirebase._firestore!;
}

export function getAdminAuth(): Auth {
  if (!globalWithFirebase._auth) {
    initializeAdmin();
  }
  return globalWithFirebase._auth!;
}
