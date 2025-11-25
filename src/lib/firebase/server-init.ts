
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let firestore: ReturnType<typeof getFirestore>;

function initializeAdminApp() {
    if (getApps().length > 0) {
        // If an app is already initialized, return it. This happens in hot-reload environments.
        return getApps()[0];
    }

    // Check for the individual environment variables first.
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // The private key needs to have its escaped newlines replaced with actual newlines.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        console.log("Initializing admin app with individual environment variables.");
        const serviceAccount: ServiceAccount = {
            projectId,
            clientEmail,
            privateKey,
        };
        return initializeApp({
            credential: cert(serviceAccount),
        });
    }

    // Fallback for deployed environments like App Hosting, where credentials are automatically provided.
    console.log("Initializing admin app with default credentials (for deployed environment).");
    return initializeApp();
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
