
import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  try {
    // In a managed environment like Firebase Hosting or Cloud Functions,
    // initializeApp() with no arguments will automatically use the environment's
    // service account credentials.
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

const adminAuth = admin.apps.length ? admin.auth() : null;
const adminDb = admin.apps.length ? admin.firestore() : null;

// This is a safeguard. If initialization fails, the actions using these will fail
// gracefully instead of crashing the entire application.
if (!adminAuth || !adminDb) {
  console.error("Firebase Admin SDK was not initialized. Server-side actions will fail.");
}

export { adminAuth, adminDb };
