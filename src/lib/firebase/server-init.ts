
import { initializeApp, getApps, App, applicationDefault, cert } from 'firebase-admin/app';
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
    
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (getApps().length === 0) {
        let credential;
        if (serviceAccountEnv) {
             try {
                // In a managed environment where the service account is a JSON string in an env var.
                const serviceAccount = JSON.parse(serviceAccountEnv);
                credential = cert(serviceAccount);
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Using applicationDefault().", e);
                // Fallback for deployed environments without specific local credentials.
                credential = applicationDefault();
            }
        } else {
             // Fallback for local dev where GOOGLE_APPLICATION_CREDENTIALS might be set, or for other environments.
            credential = applicationDefault();
        }

        firebaseGlobal.firebaseAdminApp = initializeApp({ credential });
    } else {
         // If there are existing apps, use the first one. This can happen in some environments.
        firebaseGlobal.firebaseAdminApp = getApps()[0];
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
