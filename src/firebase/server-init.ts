
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let firestore: Firestore;
let isInitialized = false;

async function initialize() {
    if (isInitialized) {
        return;
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // Check if the service account key is available in environment variables
    if (serviceAccountString) {
        try {
            const serviceAccount = JSON.parse(serviceAccountString);
            
            // Use an existing app if it's there, otherwise initialize a new one
            if (!getApps().length) {
                app = initializeApp({
                    credential: cert(serviceAccount),
                });
            } else {
                app = getApp();
            }

            auth = getAuth(app);
            firestore = getFirestore(app);
            isInitialized = true;
        } catch (e: any) {
             console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it's a valid JSON string.", e.message);
             // isInitialized remains false
        }
    }
    // No 'else' block means if the env var is not set, isInitialized remains false
}

/**
 * Initializes and/or returns the server-side Firebase Admin SDK instances.
 * This function ensures that initialization only happens once.
 * It now returns a promise to handle the async nature of initialization.
 *
 * @returns A promise that resolves to an object containing the Firebase Admin App, Auth, and Firestore instances.
 * @throws {Error} If the Admin SDK is not configured (i.e., FIREBASE_SERVICE_ACCOUNT is not set or is invalid).
 */
export async function initializeFirebaseAdmin() {
    await initialize(); // Ensure initialization is complete

    if (!isInitialized) {
        throw new Error("Server-side Firebase is not configured. Please set the FIREBASE_SERVICE_ACCOUNT environment variable.");
    }
    
    return { app, auth, firestore };
}

    