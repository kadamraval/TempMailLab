
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

interface AdminServices {
  app: App;
  auth: Auth;
  firestore: Firestore;
}

let adminServicesInstance: AdminServices | null = null;

function getAdminServices(): AdminServices {
  if (adminServicesInstance) {
    return adminServicesInstance;
  }

  const apps = getApps();
  let app: App;

  if (!apps.length) {
    // This is the correct way to initialize in a Google Cloud environment.
    // It automatically uses the service account credentials of the runtime environment.
    app = initializeApp();
  } else {
    // If an app is already initialized, use it.
    app = apps[0];
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Cache the initialized services in the singleton instance.
  adminServicesInstance = { app, auth, firestore };

  return adminServicesInstance;
}

export function getAdminFirestore(): Firestore {
  return getAdminServices().firestore;
}

export function getAdminAuth(): Auth {
  return getAdminServices().auth;
}
