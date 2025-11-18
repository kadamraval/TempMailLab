
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// This function initializes the Firebase Admin SDK.
// It's defined inside this server action file to ensure it's only used on the server.
const getAdminFirestore = () => {
    const apps = getApps();
    let app: App;

    if (apps.length === 0) {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
        }
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        app = apps[0]!;
    }
    
    return getFirestore(app);
};


async function getMailgunCredentials() {
    const firestore = getAdminFirestore();
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        throw new Error('Mailgun settings not found in admin_settings.');
    }

    const settings = settingsSnap.data();
    if (!settings?.enabled || !settings.apiKey || !settings.domain) {
        throw new Error('Mailgun integration is not enabled or fully configured.');
    }

    return { apiKey: settings.apiKey, domain: settings.domain };
}


/**
 * A secure server action that fetches emails for a given address
 * and then saves them to Firestore. It securely retrieves Mailgun
 * credentials from admin settings.
 */
export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    inboxId: string,
): Promise<{ success: boolean; error?: string }> {
    if (!emailAddress || !inboxId) {
        return { success: false, error: 'Email address and Inbox ID are required.' };
    }
    
    try {
        const { apiKey, domain } = await getMailgunCredentials();
        const firestore = getAdminFirestore();
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: "stored",
            limit: 30,
            begin: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(),
        });
        
        if (!events?.items?.length) {
            return { success: true }; // No new mail, which is a success case.
        }

        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);

        for (const event of events.items) {
            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                console.warn(`Skipping event with no message-id: ${event.id}`);
                continue;
            }

            if (!event.storage || !event.storage.url) {
                console.warn(`Skipping event with no storage URL: ${event.id}`);
                continue;
            }

            try {
                // Correctly parse the path from the storage URL
                const storagePath = new URL(event.storage.url).pathname.replace('/v3', '');
                const messageDetails = await mg.get(storagePath);
                
                if (!messageDetails || !messageDetails.body) {
                    console.warn(`Could not retrieve email body for event: ${event.id}`);
                    continue;
                };
                
                const message = messageDetails.body;
                const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                const emailRef = emailsCollectionRef.doc(messageId);
                
                const emailData: Omit<Email, 'id'> = {
                    recipient: emailAddress,
                    senderName: message.From || "Unknown Sender",
                    subject: message.Subject || "No Subject",
                    receivedAt: Timestamp.fromDate(new Date(event.timestamp * 1000)),
                    htmlContent: cleanHtml,
                    textContent: message["stripped-text"] || "No text content.",
                    rawContent: JSON.stringify(message, null, 2),
                    attachments: message.attachments || [],
                    read: false,
                };

                batch.set(emailRef, emailData, { merge: true });

            } catch(err) {
                console.error(`Failed to process and save email for event ${event.id}. Error:`, err);
            }
        }
        
        await batch.commit();
        
        return { success: true };

    } catch (error: any) {
        console.error("[MAILGUN_ACTION_ERROR]", error);
        if (error.status === 401) {
            return { success: false, error: 'Mailgun authentication failed. Please check your API key.' };
        }
        if (error.message && error.message.includes('free accounts are for test purposes only')) {
             return { success: false, error: 'Your Mailgun account is a free test account. You may need to add authorized recipients in Mailgun settings.' };
        }
        if (error.message.includes('Mailgun settings not found')) {
            return { success: false, error: 'The Mailgun integration has not been configured by an administrator.' };
        }
        return { success: false, error: error.message || 'An unexpected error occurred while fetching emails from Mailgun.' };
    }
}
