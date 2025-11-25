
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let firestore: ReturnType<typeof getFirestore>;

function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!rawServiceAccount) {
        // In a deployed environment like App Hosting, the SDK can initialize without any args.
        try {
            console.log("Initializing admin app with default credentials (for deployed environment).");
            return initializeApp();
        } catch (e: any) {
            throw new Error("No FIREBASE_SERVICE_ACCOUNT defined and default initialization failed. Error: " + e.message);
        }
    }

    try {
        console.log("Initializing admin app with FIREBASE_SERVICE_ACCOUNT environment variable.");
        const serviceAccount: ServiceAccount = JSON.parse(rawServiceAccount);
        return initializeApp({
            credential: cert(serviceAccount),
        });
    } catch (e: any) {
        // This will catch JSON parsing errors.
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it's a valid, minified JSON string.", e);
        throw new Error("Server configuration error: Could not parse service account credentials.");
    }
}


function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getAdminFirestore(): ReturnType<typeof getFirestore> {
    if (!firestore) {
        const app = getAdminApp();
        firestore = getFirestore(app);
    }
    return firestore;
}
