
// IMPORTANT: This file should only be imported by server-side code.
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface FirebaseAdminServices {
  app: App;
  firestore: Firestore;
}

// Memoize the initialized services to prevent re-initialization on every call.
let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes and provides the Firebase Admin SDK services (app, firestore).
 * It safely handles initialization and is designed to be used in server-side
 * environments (like Server Components and Server Actions) in Next.js.
 * In a managed environment like Firebase App Hosting, the SDK can auto-discover credentials.
 *
 * @returns {FirebaseAdminServices} An object containing the admin app and firestore instances. Throws an error if initialization fails.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  if (adminServices) {
    return adminServices;
  }
  
  try {
    const apps = getApps();
    // Initialize without explicit credentials. The SDK will find them in the environment.
    const app = apps.length ? apps[0]! : initializeApp();
    const firestore = getFirestore(app);

    adminServices = { app, firestore };
    return adminServices;

  } catch (e: any) {
    throw new Error(`Firebase Admin SDK initialization failed: ${e.message}`);
  }
}
