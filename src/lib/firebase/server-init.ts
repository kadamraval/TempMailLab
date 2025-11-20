
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
const apps = getApps();

if (!apps.length) {
    app = initializeApp({
        credential: credential.applicationDefault(),
        projectId: 'tempinbox-525dm',
    });
} else {
    app = apps[0]!;
}

const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export function getAdminFirestore(): Firestore {
  return firestore;
}

export function getAdminAuth(): Auth {
  return auth;
}
