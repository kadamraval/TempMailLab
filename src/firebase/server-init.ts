// IMPORTANT: This file should only be imported by server-side code.
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAppCheck } from 'firebase-admin/app-check';

interface FirebaseAdminServices {
  app: App;
  firestore: Firestore;
}

// Memoize the initialized services to prevent re-initialization on every call.
let adminServices: FirebaseAdminServices | null = null;

function getServiceAccount(): ServiceAccount | undefined {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // For local development, you might use a file path
    // and for deployed environments, the variable should be set.
    return undefined;
}


/**
 * Initializes and provides the Firebase Admin SDK services (app, firestore).
 * It safely handles initialization and is designed to be used in server-side
 * environments (like Server Components and Server Actions) in Next.js.
 *
 * @returns {FirebaseAdminServices} An object containing the admin app and firestore instances. Throws an error if initialization fails.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  if (adminServices) {
    return adminServices;
  }

  // The service account key is stored in an environment variable.
  // This is a secure way to provide credentials in a server environment.
  const serviceAccount = getServiceAccount();
  
  if (!serviceAccount) {
    throw new Error(
        "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
        "Server-side Firebase functionality will be disabled."
    );
  }
  
  try {
    const credential = cert(serviceAccount);
    const apps = getApps();
    const app = apps.length ? apps[0]! : initializeApp({ credential });
    const firestore = getFirestore(app);

    adminServices = { app, firestore };
    return adminServices;

  } catch (e: any) {
    throw new Error(`Firebase Admin SDK initialization failed: ${e.message}`);
  }
}
