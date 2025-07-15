// @/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !privateKey
  ) {
    console.error(
      'Firebase credentials are not set in the environment variables. Please check your .env file.'
    );
  } else {
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
  }
} else {
  app = admin.app();
}

const auth = admin.auth(app!);
const firestore = admin.firestore(app!);

export { auth, firestore };
