
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

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
