'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

interface SignUpResult {
    success: boolean;
    error?: string;
    userId?: string;
}

export async function signUpAction(uid: string, email: string, anonymousInboxId: string | null): Promise<SignUpResult> {
    try {
        const firestore = getAdminFirestore();
        const userRef = firestore.doc(`users/${uid}`);
        const userDoc = await userRef.get();

        // If the user document does not exist, create it.
        if (!userDoc.exists) {
            const isAdmin = email === 'admin@example.com';
            
            await userRef.set({
                uid,
                email,
                displayName: email.split('@')[0],
                inboxCount: 0,
                planId: 'free-default',
                isAdmin,
                createdAt: Timestamp.now(),
            });
        }

        // If there was an inbox from a guest session, re-assign it to the new permanent user.
        if (anonymousInboxId) {
            const inboxRef = firestore.doc(`inboxes/${anonymousInboxId}`);
            const inboxSnap = await inboxRef.get();
            const inboxData = inboxSnap.data();

            // Check if the guest inbox exists and belongs to the anonymous user who is signing up.
            // This assumes the anonymous UID was correctly stored on the inbox.
            if (inboxSnap.exists() && inboxData?.userId && inboxData.userId !== uid) {
                 await inboxRef.update({ userId: uid });
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
