
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminFirestore: Firestore;

function initializeAdminApp() {
    const existingApp = getApps().find(app => app.name === 'admin');
    if (existingApp) {
        adminApp = existingApp;
        adminFirestore = getFirestore(adminApp);
        return;
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountString) {
        throw new Error('Server configuration error: Firebase credentials are not set.');
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        adminApp = initializeApp({
            credential: cert(serviceAccount),
        }, 'admin');
        adminFirestore = getFirestore(adminApp);
    } catch (e: any) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize admin app:", e.message);
        throw new Error("Server configuration error: Could not initialize Firebase Admin SDK.");
    }
}

export function getAdminFirestore() {
    if (!adminFirestore) {
        initializeAdminApp();
    }
    return adminFirestore;
}
