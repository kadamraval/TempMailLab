
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
  let app: App;

  if (!apps.length) {
      // Use application default credentials, which is the standard and most reliable way
      // for server-side Google Cloud environments (like Cloud Run where this code executes)
      // to authenticate.
      const appCredential = credential.applicationDefault();
      
      app = initializeApp({
          credential: appCredential,
          // Explicitly setting the projectId removes any ambiguity and is a best practice.
          projectId: 'tempinbox-525dm',
      });
  } else {
      app = apps[0]!;
  }

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
