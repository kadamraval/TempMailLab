
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

if (!admin.apps.length) {
  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // Only initialize if all credentials are provided
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error:', error.stack);
    }
  } else {
    console.warn(
      'Firebase Admin SDK not initialized. Missing environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    );
  }
} else {
  app = admin.apps[0]!;
}

const adminAuth = app ? admin.auth() : null;
const adminDb = app ? admin.firestore() : null;

if (!adminAuth || !adminDb) {
    // This will now only log if initialization truly fails or is skipped.
    // It won't throw, preventing a crash, but will fail gracefully in actions.
    console.error(
        "Firebase Admin SDK has not been properly initialized. API calls using admin auth will fail."
    );
}

export { adminAuth, adminDb };
