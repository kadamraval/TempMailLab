
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
    
    if (getApps().length === 0) {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        if (serviceAccountEnv) {
             try {
                // The service account is a JSON string in the env var. Parse it.
                const serviceAccount = JSON.parse(serviceAccountEnv);
                firebaseGlobal.firebaseAdminApp = initializeApp({
                    credential: cert(serviceAccount)
                });
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Falling back to applicationDefault().", e);
                // Fallback for deployed environments if parsing fails.
                firebaseGlobal.firebaseAdminApp = initializeApp({ credential: applicationDefault() });
            }
        } else {
             // Fallback for deployed environments where the service account is discovered automatically.
            firebaseGlobal.firebaseAdminApp = initializeApp({ credential: applicationDefault() });
        }
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
