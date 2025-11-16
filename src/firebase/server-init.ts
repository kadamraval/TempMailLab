
import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This is a singleton pattern to ensure we only initialize Firebase Admin once.
// It is crucial for serverless environments where function instances can be reused.

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;
let initializationError: Error | null = null;
let isInitialized = false;

function initializeAdmin() {
  if (isInitialized) {
    return; // Already attempted initialization
  }
  isInitialized = true;

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      initializationError = new Error('Firebase Admin SDK service account is not set in environment variables (FIREBASE_SERVICE_ACCOUNT). Server-side actions that require admin privileges will fail.');
      console.warn(`[SERVER_INIT_WARNING] ${initializationError.message}`);
      return;
    }

    let serviceAccount: ServiceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
      initializationError = new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.');
      console.error(`[SERVER_INIT_ERROR] ${initializationError.message}`);
      return;
    }

    const existingApp = getApps().length > 0 ? getApp() : null;
    adminApp = existingApp || initializeApp({ credential: cert(serviceAccount) });
    
    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);

  } catch (error: any) {
    initializationError = error;
    console.error("[SERVER_INIT_ERROR] Critical Firebase Admin SDK initialization failed:", error.message);
  }
}

/**
 * Provides access to the initialized Firebase Admin SDK instances.
 * This function will initialize the SDK on its first call and return
 * the existing instances on subsequent calls.
 *
 * It no longer throws but returns an error state if initialization fails.
 *
 * @returns An object containing the initialized instances OR an error.
 */
export function getFirebaseAdmin() {
  // Lazily initialize on the first call.
  if (!isInitialized) {
    initializeAdmin();
  }

  // If initialization failed, return the error.
  if (initializationError) {
    return { app: null, auth: null, firestore: null, error: initializationError };
  }
  
  // If initialization was successful, we can be sure these are non-null.
  return {
    app: adminApp!,
    auth: adminAuth!,
    firestore: adminFirestore!,
    error: null,
  };
}
