
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
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

  // Ensure all required environment variables are present
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("Firebase Admin SDK environment variables are not set. Please check your .env file.");
  }

  const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key must have its newlines escaped in the .env file
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  const apps = getApps();
  const app: App = !apps.length
    ? initializeApp({ credential: cert(serviceAccount) })
    : apps[0];

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
