
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;
let adminFirestore: Firestore;

if (!getApps().some(app => app.name === 'admin')) {
  adminApp = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
  }, 'admin');
} else {
  adminApp = getApps().find(app => app.name === 'admin')!;
}

adminFirestore = getFirestore(adminApp);

export function getAdminFirestore() {
    return adminFirestore;
}

    