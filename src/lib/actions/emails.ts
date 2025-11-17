
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { Email } from '@/types';

// This is the server-side initialization for Firebase Admin.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;
if (!getApps().length) {
    // Initialize the app only if it's not already initialized.
    adminApp = initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
    });
} else {
    // Get the existing app if it's already initialized.
    adminApp = getApps()[0];
}

// Get a reference to the admin Firestore service.
const firestore = getFirestore(adminApp);


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
        return { success: true }; // Nothing to save.
    }

    try {
        // Use the admin firestore instance to create a batch write.
        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);

        emails.forEach((email) => {
            const emailRef = emailsCollectionRef.doc(email.id);
            // Ensure we don't save undefined values which can cause errors.
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
