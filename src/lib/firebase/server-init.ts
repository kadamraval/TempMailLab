
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;

// This function ensures the app is initialized only once in a way that is
// compatible with Next.js server environments and hot-reloading.
function initializeAdminApp(): App {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0] as App;
    }

    // When running on Google Cloud (like Firebase App Hosting), GOOGLE_APPLICATION_CREDENTIALS
    // is automatically set. credential.applicationDefault() uses this.
    // For local development, you must set this environment variable to point to your service account key file.
    const cred = credential.applicationDefault();

    return initializeApp({
        credential: cred,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tempinbox-525dm', // Fallback for safety
    });
}

// Initialize the app when this module is first loaded
if (!app!) {
    app = initializeAdminApp();
}


const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export function getAdminFirestore(): Firestore {
  return firestore;
}

export function getAdminAuth(): Auth {
  return auth;
}
