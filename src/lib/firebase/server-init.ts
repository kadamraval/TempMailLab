
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

interface AdminServices {
  app: App;
  auth: Auth;
  firestore: Firestore;
}

// This is a "singleton" pattern. It ensures that the Firebase Admin SDK is initialized only once.
let adminServicesInstance: AdminServices | null = null;

function getAdminServices(): AdminServices {
  // If the instance already exists, return it.
  if (adminServicesInstance) {
    return adminServicesInstance;
  }

  const apps = getApps();
  const app: App = !apps.length
    // Initialize the app with the service account credentials and Project ID.
    ? initializeApp({
        credential: credential.applicationDefault(),
        projectId: process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'tempinbox-525dm',
    })
    : apps[0]!;

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  
  // Cache the initialized services instance.
  adminServicesInstance = { app, auth, firestore };
  return adminServicesInstance;
}

// Export getter functions that ensure the services are initialized before use.
export function getAdminFirestore(): Firestore {
  return getAdminServices().firestore;
}

export function getAdminAuth(): Auth {
  return getAdminServices().auth;
}
