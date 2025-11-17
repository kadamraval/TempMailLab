// IMPORTANT: This file should only be imported by server-side code.
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface FirebaseAdminServices {
  app: App | null;
  firestore: Firestore | null;
  error?: Error;
}

// Memoize the initialized services to prevent re-initialization on every call.
let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes and provides the Firebase Admin SDK services (app, firestore).
 * It safely handles initialization and is designed to be used in server-side
 * environments (like Server Components and Server Actions) in Next.js.
 *
 * @returns {FirebaseAdminServices} An object containing the admin app and firestore instances, or an error if initialization fails.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  if (adminServices) {
    return adminServices;
  }

  // The service account key is stored in an environment variable.
  // This is a secure way to provide credentials in a server environment.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountKey) {
    const error = new Error(
        "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
        "Server-side Firebase functionality will be disabled."
      );
    console.warn(`[getFirebaseAdmin] ${error.message}`);
    adminServices = { app: null, firestore: null, error };
    return adminServices;
  }
  
  try {
    const credential = cert(JSON.parse(serviceAccountKey));
    const apps = getApps();
    const app = apps.length ? apps[0] : initializeApp({ credential });
    const firestore = getFirestore(app);

    adminServices = { app, firestore };
    return adminServices;

  } catch (e: any) {
    const error = new Error(`Firebase Admin SDK initialization failed: ${e.message}`);
    console.error(`[getFirebaseAdmin] ${error.message}`);
    adminServices = { app: null, firestore: null, error };
    return adminServices;
  }
}
