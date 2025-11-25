import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let firestore: ReturnType<typeof getFirestore>;

function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountString) {
        try {
            const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
            console.log("Attempting to initialize admin app with FIREBASE_SERVICE_ACCOUNT environment variable.");
            return initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error: any) {
            console.error(
                "CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure the environment variable is a valid JSON string. Falling back to default initialization.",
                "Error:", error.message
            );
            // Fallback to default initialization if parsing fails
            return initializeApp();
        }
    } else {
        console.log("Initializing admin app with default credentials (for deployed environment).");
        // This is the standard for deployed environments like App Hosting
        return initializeApp();
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
