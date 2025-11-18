
'use server';

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

    try {
        // When running in a Google Cloud environment (like App Hosting),
        // the SDK can automatically discover credentials.
        adminApp = initializeApp(undefined, 'admin');
        adminFirestore = getFirestore(adminApp);
    } catch (e: any) {
        console.error("Failed to initialize admin app:", e.message);
        throw new Error("Server configuration error: Could not initialize Firebase Admin SDK.");
    }
}

export async function getAdminFirestore() {
    if (!adminFirestore) {
        initializeAdminApp();
    }
    return adminFirestore;
}
