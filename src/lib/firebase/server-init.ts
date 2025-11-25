
import { initializeApp, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'tempmail-admin-app';

let adminApp: App | undefined;
let firestore: ReturnType<typeof getFirestore> | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Try to reuse if we already created it earlier in this process
  try {
    adminApp = getApp(ADMIN_APP_NAME);
    return adminApp;
  } catch {
    // app with that name does not exist yet → create it
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawServiceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(rawServiceAccount) as ServiceAccount;
  } catch (e) {
    console.error('FAILED TO PARSE FIREBASE_SERVICE_ACCOUNT', e);
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
  }

  adminApp = initializeApp(
    {
      credential: cert(serviceAccount),
    },
    ADMIN_APP_NAME
  );

  return adminApp;
}

export function getAdminFirestore() {
  if (!firestore) {
    const app = getAdminApp();
    firestore = getFirestore(app);
  }
  return firestore;
}
