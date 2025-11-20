
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import type { Inbox } from '@/types';

interface SignUpResult {
    success: boolean;
    error?: string;
    userId?: string;
}

/**
 * Creates a new user document in Firestore and handles the migration of an anonymous inbox.
 * This is a server action and should only be called from a server environment.
 * @param uid The UID of the newly created Firebase Auth user.
 * @param email The email of the new user.
 * @param anonymousInboxData JSON string of the anonymous inbox data from localStorage.
 * @returns A result object indicating success or failure.
 */
export async function signUpAction(uid: string, email: string, anonymousInboxData: string | null): Promise<SignUpResult> {
    try {
        const firestore = getAdminFirestore();

        // 1. Create the new user document.
        const userRef = firestore.doc(`users/${uid}`);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // This case can happen with social sign-ins if the doc was created in a previous step.
            // We can just proceed.
        } else {
             // The first user to sign up with this specific email becomes an admin.
             // IMPORTANT: Change this to your own email address to become the first admin.
            const isAdmin = email === 'admin@example.com';
            
            await userRef.set({
                uid,
                email,
                planId: 'free-default', // All new users start on the free plan.
                isAdmin,
                createdAt: Timestamp.now(),
            });
        }

        // 2. Handle the anonymous inbox migration.
        if (anonymousInboxData) {
            const { id: inboxId, ownerToken } = JSON.parse(anonymousInboxData);
            if (inboxId && ownerToken) {
                const inboxRef = firestore.doc(`inboxes/${inboxId}`);
                const inboxSnap = await inboxRef.get();

                if (inboxSnap.exists) {
                    const currentInboxData = inboxSnap.data() as Inbox;
                    // Security check: Only migrate the inbox if the ownerToken matches.
                    if (currentInboxData.ownerToken === ownerToken) {
                        // Assign the inbox to the new user and remove the temporary token.
                        await inboxRef.update({
                            userId: uid,
                            ownerToken: null, // or FieldValue.delete()
                        });
                    }
                }
            }
        }
        
        // Revalidate paths to ensure data is fresh on the client.
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/dashboard/inbox');

        return { success: true, userId: uid };

    } catch (error: any) {
        console.error("[signUpAction Error]", error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred during sign-up.',
        };
    }
}
