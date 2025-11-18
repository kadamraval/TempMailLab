'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { cache } from 'react';

// This function uses React's 'cache' to ensure it only runs once per request
// in a serverless environment. This is the modern, recommended approach.
export const getAdminFirestore = cache(async (): Promise<Firestore> => {
    const apps = getApps();
    let app: App;

    if (apps.length === 0) {
        // In a Google Cloud environment (like App Hosting), the SDK can
        // automatically detect the project credentials.
        app = initializeApp();
    } else {
        app = apps[0]!;
    }
    
    return getFirestore(app);
});
