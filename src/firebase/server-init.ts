
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminFirestore: Firestore;

// This function ensures that the admin app is initialized only once.
function initializeAdminApp() {
    const existingApp = getApps().find(app => app.name === 'admin');
    if (existingApp) {
        adminApp = existingApp;
        adminFirestore = getFirestore(adminApp);
        return;
    }

    // This code path should only run on the server.
    // The environment variable must be available in the server environment.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountString) {
        throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set. The server actions cannot connect to Firebase.');
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

// Call the initialization function at the module level.
// This will run once when the module is first loaded on the server.
initializeAdminApp();

// Export a getter function to be used by server actions.
export function getAdminFirestore() {
    if (!adminFirestore) {
        // This is a fallback in case the initial setup failed, though it shouldn't be hit
        // if the environment is configured correctly.
        initializeAdminApp();
    }
    return adminFirestore;
}
