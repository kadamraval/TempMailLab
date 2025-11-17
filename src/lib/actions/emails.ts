
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { Email } from '@/types';

// This is the server-side initialization for Firebase Admin.
// It checks if the app is already initialized to prevent errors.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
    });
} else {
    adminApp = getApps()[0];
}

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
        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);

        emails.forEach((email) => {
            const emailRef = emailsCollectionRef.doc(email.id);
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
