
"use client";

import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Only initialize if all credentials are provided
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  } else {
    console.warn("Firebase Admin SDK credentials not found in environment variables. Skipping initialization.");
  }
} else {
  app = admin.apps[0]!;
}

const adminAuth = app! ? admin.auth(app) : null;
const adminDb = app! ? admin.firestore(app) : null;

// Throw an error if initialization failed, making it clear that env vars are needed.
if (!adminAuth || !adminDb) {
    throw new Error(
        "Firebase Admin SDK has not been initialized. Please check your environment variables."
    );
}

export { adminAuth, adminDb };
