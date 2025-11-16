
import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This is a singleton pattern to ensure we only initialize Firebase Admin once.
// It is crucial for serverless environments where function instances can be reused.

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;
let initializationError: Error | null = null;

function initializeAdmin() {
  if (adminApp || initializationError) {
    return; // Already initialized or failed trying
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      // This is a critical configuration error. The server action cannot function without it.
      throw new Error('Firebase Admin SDK service account is not set in environment variables (FIREBASE_SERVICE_ACCOUNT).');
    }

    let serviceAccount: ServiceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.');
    }

    // Use an existing app if it's there, otherwise initialize a new one.
    // This handles Next.js hot-reloading in development.
    const existingApp = getApps().length > 0 ? getApp() : null;
    adminApp = existingApp || initializeApp({ credential: cert(serviceAccount) });
    
    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);

  } catch (error: any) {
    // If initialization fails, we store the error and prevent future attempts.
    initializationError = error;
    console.error("CRITICAL: Firebase Admin SDK initialization failed:", error.message);
    // We don't re-throw here, getFirebaseAdmin will handle it.
  }
}

/**
 * Provides access to the initialized Firebase Admin SDK instances.
 * This function will initialize the SDK on its first call and return
 * the existing instances on subsequent calls.
 *
 * @returns An object containing the initialized Firebase Admin App, Auth, and Firestore instances.
 * @throws {Error} If the Admin SDK failed to initialize.
 */
export function getFirebaseAdmin() {
  // The initialization is done lazily on the first request.
  if (!adminApp && !initializationError) {
    initializeAdmin();
  }

  // If there was an error during initialization, we throw it on every subsequent call.
  if (initializationError) {
    throw initializationError;
  }
  
  // If initialization was successful, we can be sure these are non-null.
  return {
    app: adminApp!,
    auth: adminAuth!,
    firestore: adminFirestore!,
  };
}
