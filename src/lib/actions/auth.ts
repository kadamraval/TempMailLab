
'use server';

import { revalidatePath } from 'next/cache';
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Self-contained Firebase Admin initialization
function getAdminFirestore() {
    if (getApps().some(app => app.name === 'admin-auth')) {
        return getFirestore(getApps().find(app => app.name === 'admin-auth'));
    }

    let serviceAccount: ServiceAccount;
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
        }
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e: any) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
        throw new Error("Server configuration error: Could not parse service account credentials.");
    }
    
    const adminApp = initializeApp({
        credential: cert(serviceAccount)
    }, 'admin-auth');

    return getFirestore(adminApp);
}

interface SignUpResult {
    success: boolean;
    error?: string;
    userId?: string;
}

export async function signUpAction(uid: string, email: string, anonymousInboxData: string | null): Promise<SignUpResult> {
    try {
        const firestore = getAdminFirestore();
        const userRef = firestore.doc(`users/${uid}`);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            const isAdmin = email === 'admin@example.com';
            
            await userRef.set({
                uid,
                email,
                planId: 'free-default',
                isAdmin,
                createdAt: Timestamp.now(),
            });
        }

        if (anonymousInboxData) {
            const { id: inboxId } = JSON.parse(anonymousInboxData);
            if (inboxId) {
                const inboxRef = firestore.doc(`inboxes/${inboxId}`);
                const inboxSnap = await inboxRef.get();

                if (inboxSnap.exists) {
                     await inboxRef.update({ userId: uid });
                }
            }
        }
        
        revalidatePath('/');
        revalidatePath('/admin', 'layout');

        return { success: true, userId: uid };

    } catch (error: any) {
        console.error("[signUpAction Error]", error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred during sign-up.',
        };
    }
}
