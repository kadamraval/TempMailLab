
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// This interface defines the structure of our admin services singleton.
interface AdminServices {
  app: App;
  auth: Auth;
  firestore: Firestore;
}

// A global variable to hold the singleton instance.
let adminServicesInstance: AdminServices | null = null;

/**
 * Initializes and/or returns a singleton instance of the Firebase Admin SDK services.
 * This pattern ensures that initializeApp() is called only once, preventing errors
 * in environments like Next.js server actions where code can be re-evaluated.
 *
 * @returns {AdminServices} An object containing the initialized admin app, auth, and firestore services.
 */
function getAdminServices(): AdminServices {
  // If the instance already exists, return it immediately to prevent re-initialization.
  if (adminServicesInstance) {
    return adminServicesInstance;
  }

  // Check if there are any initialized apps. The getApps() function returns an array.
  const apps = getApps();
  let app: App;

  // If no apps are initialized, call initializeApp().
  // In a Google Cloud environment (like App Hosting), calling it without arguments
  // automatically discovers the service account credentials and project ID.
  if (!apps.length) {
    console.log("Initializing Firebase Admin SDK for the first time...");
    app = initializeApp();
  } else {
    // If apps exist, use the already-initialized default app.
    console.log("Re-using existing Firebase Admin SDK app instance.");
    app = apps[0];
  }

  // Create the services object.
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Store the new instance in the global variable for future calls.
  adminServicesInstance = { app, auth, firestore };

  return adminServicesInstance;
}

/**
 * Returns an initialized Firebase Admin Firestore instance.
 * This is a convenience function that uses the singleton pattern.
 */
export function getAdminFirestore(): Firestore {
  return getAdminServices().firestore;
}

/**
 * Returns an initialized Firebase Admin Auth instance.
 * This is a convenience function that uses the singleton pattern.
 */
export function getAdminAuth(): Auth {
  return getAdminServices().auth;
}
