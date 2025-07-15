// @/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;
let auth: admin.auth.Auth | undefined;
let firestore: admin.firestore.Firestore | undefined;

if (admin.apps.length) {
  app = admin.app();
} else {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    privateKey
  ) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  } else {
    // This warning is helpful for developers during setup.
    console.warn(
      'Firebase credentials are not set in the environment variables. Firebase Admin features will be disabled.'
    );
  }
}

if (app) {
  auth = admin.auth(app);
  firestore = admin.firestore(app);
}

export { auth, firestore };
