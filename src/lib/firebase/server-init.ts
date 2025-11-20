
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
    app = initializeApp();
  } else {
    app = apps[0];
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  adminServicesInstance = { app, auth, firestore };

  return adminServicesInstance;
}

export function getAdminFirestore(): Firestore {
  return getAdminServices().firestore;
}

export function getAdminAuth(): Auth {
  return getAdminServices().auth;
}
