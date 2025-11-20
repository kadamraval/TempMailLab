
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

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

  // Ensure all required environment variables are present. This is the crucial check.
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("Firebase Admin SDK environment variables are not set. Please check your .env file and ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are all populated.");
  }

  // Construct the service account credentials from the environment variables.
  const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key must have its newlines escaped in the .env file.
      // The replace call here un-escapes them for the SDK.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  const apps = getApps();
  const app: App = !apps.length
    // Initialize the app with the service account credentials.
    ? initializeApp({ credential: cert(serviceAccount) })
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
