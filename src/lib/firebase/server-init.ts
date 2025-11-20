
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

function initializeAdmin() {
    if (!adminApp) {
        const apps = getApps();
        if (apps.length > 0) {
            adminApp = apps[0] as App;
        } else {
            // When running on Google Cloud (like Firebase App Hosting), GOOGLE_APPLICATION_CREDENTIALS
            // is automatically set. credential.applicationDefault() uses this.
            // For local development, you must set this environment variable to point to your service account key file.
            const cred = credential.applicationDefault();
            adminApp = initializeApp({
                credential: cred,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tempinbox-525dm', // Fallback for safety
            });
        }
        firestore = getFirestore(adminApp);
        auth = getAuth(adminApp);
    }
}

// Call initialization
initializeAdmin();

export function getAdminFirestore(): Firestore {
  if (!firestore) {
    initializeAdmin();
  }
  return firestore!;
}

export function getAdminAuth(): Auth {
  if (!auth) {
    initializeAdmin();
  }
  return auth!;
}
