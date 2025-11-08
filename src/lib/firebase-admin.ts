import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

let app: admin.app.App;

function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // In a managed environment like Firebase Hosting or Cloud Functions,
    // initializeApp() with no arguments will automatically use the environment's
    // service account credentials.
    app = admin.initializeApp();
    return app;
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin SDK. Please check server logs.');
  }
}

function getAdminAuth(): Auth {
    if (!app) {
        initializeAdminApp();
    }
    const auth = admin.auth(app);
    if (!auth) {
        throw new Error('Firebase Admin Auth is not available.');
    }
    return auth;
}

function getAdminDb(): Firestore {
    if (!app) {
        initializeAdminApp();
    }
    const db = admin.firestore(app);
    if (!db) {
        throw new Error('Firebase Admin Firestore is not available.');
    }
    return db;
}


export { getAdminAuth, getAdminDb };
