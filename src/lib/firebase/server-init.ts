
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
    
    // If there are already apps initialized by another means, use the first one.
    // This can happen in some environments.
    if (getApps().length > 0) {
        firebaseGlobal.firebaseAdminApp = getApps()[0];
    } else {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        // This logic handles both local and deployed environments.
        if (serviceAccountEnv) {
             // LOCAL: Use the service account JSON from the environment variable.
             try {
                const serviceAccount = JSON.parse(serviceAccountEnv);
                firebaseGlobal.firebaseAdminApp = initializeApp({
                    credential: cert(serviceAccount)
                });
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Falling back to applicationDefault().", e);
                // Fallback for safety, though it might fail locally if ADC isn't set up.
                firebaseGlobal.firebaseAdminApp = initializeApp({ credential: applicationDefault() });
            }
        } else {
             // LIVE (DEPLOYED): Use Application Default Credentials.
            firebaseGlobal.firebaseAdminApp = initializeApp({ credential: applicationDefault() });
        }
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
