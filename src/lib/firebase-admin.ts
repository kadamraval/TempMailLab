
import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
} else {
  app = admin.apps[0]!;
}

// These will be null if initialization fails
const adminAuth = app! ? admin.auth() : null;
const adminDb = app! ? admin.firestore() : null;

// Throw an error if initialization failed, making it clear that env vars are needed.
if (!adminAuth || !adminDb) {
    console.error(
        "Firebase Admin SDK has not been initialized. Please check your environment variables."
    );
}

export { adminAuth, adminDb };
