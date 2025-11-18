
'use server';

import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
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
        // Explicitly use applicationDefault() credentials for robust initialization
        // in Google Cloud environments.
        adminApp = initializeApp({
            credential: applicationDefault(),
        }, 'admin');
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
