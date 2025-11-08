
import * as admin from 'firebase-admin';

let app;

if (!admin.apps.length) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
} else {
  app = admin.apps[0];
}

const adminAuth = app ? admin.auth(app) : null;
const adminDb = app ? admin.firestore(app) : null;

// Throw an error if initialization failed, making it clear that env vars are needed.
if (!adminAuth || !adminDb) {
    throw new Error(
        "Firebase Admin SDK has not been initialized. Please check your environment variables."
    );
}

export { adminAuth, adminDb };
