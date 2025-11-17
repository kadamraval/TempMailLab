
'use server';

import { initializeFirebase } from '@/firebase/server-init';
import type { Email } from '@/types';
import { writeBatch, collection, doc } from 'firebase/firestore';

/**
 * Saves a batch of emails to a specified inbox's subcollection in Firestore.
 * @param inboxId The ID of the inbox document.
 * @param emails An array of email objects to save.
 * @returns An object indicating success or an error message.
 */
export async function saveEmailsAction(inboxId: string, emails: Email[]) {
    if (!inboxId) {
        return { error: 'Inbox ID is required.' };
    }
    if (!emails || emails.length === 0) {
        return { success: true }; // Nothing to save
    }

    try {
        const { firestore } = initializeFirebase();
        const batch = writeBatch(firestore);

        const emailsCollectionRef = collection(firestore, `inboxes/${inboxId}/emails`);

        emails.forEach((email) => {
            const emailRef = doc(emailsCollectionRef, email.id);
            // Ensure we don't save undefined values
            const emailData = {
                ...email,
                htmlContent: email.htmlContent || "",
                textContent: email.textContent || "",
                rawContent: email.rawContent || "",
                attachments: email.attachments || [],
            };
            batch.set(emailRef, emailData);
        });

        await batch.commit();

        return { success: true };

    } catch (error: any) {
        console.error("[SAVE_EMAILS_ACTION_ERROR]", error);
        return { error: error.message || 'An unknown server error occurred while saving emails.' };
    }
}
