
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;

// This function ensures the app is initialized only once.
function initializeAdminApp(): App {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0]!;
    }
    // Initialize the app with application default credentials
    return initializeApp({
        credential: credential.applicationDefault(),
        projectId: 'tempinbox-525dm',
    });
}

// Initialize the app when this module is first loaded
app = initializeAdminApp();

const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export function getAdminFirestore(): Firestore {
  return firestore;
}

export function getAdminAuth(): Auth {
  return auth;
}
