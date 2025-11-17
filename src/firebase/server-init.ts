
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminFirestore: Firestore;

// This function ensures that the admin app is initialized only once.
function initializeAdminApp() {
    // Check if the admin app is already initialized to prevent re-initialization
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
        // This log is for the developer running the server, it won't show in the client.
        console.error("Firebase Admin initialization failed: The FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
        // We throw an error to fail fast on the server, making the configuration issue clear.
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

// Export a getter function to be used by server actions.
export function getAdminFirestore() {
    // Initialize only when the function is first called.
    if (!adminFirestore) {
        initializeAdminApp();
    }
    return adminFirestore;
}
