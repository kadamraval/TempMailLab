
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

        if (!userDoc.exists) {
            const isAdmin = email === 'admin@example.com';
            
            // Standardize the user object being created
            await userRef.set({
                uid,
                email,
                displayName: email.split('@')[0], // Default display name
                inboxCount: 0,
                planId: 'free-default',
                isAdmin,
                createdAt: Timestamp.now(),
            });
        }

        // If there's an inbox ID from an anonymous session, re-assign it to the new permanent user.
        if (anonymousInboxId) {
            const inboxRef = firestore.doc(`inboxes/${anonymousInboxId}`);
            const inboxSnap = await inboxRef.get();
            // Check if the inbox exists and actually belonged to a guest (or is being claimed)
            if (inboxSnap.exists) {
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
