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
            // This should not happen in production if the env var is set.
            // In development, this indicates a setup issue.
            throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
        }
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (e: any) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize app:", e.message);
            throw new Error("Server configuration error: Could not initialize Firebase Admin.");
        }
    } else {
        app = apps[0]!;
    }
    
    return getFirestore(app);
};

async function getMailgunCredentials(firestore: ReturnType<typeof getAdminFirestore>) {
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        throw new Error('Mailgun settings not found in admin_settings/mailgun. Please configure it in the admin dashboard.');
    }

    const settings = settingsSnap.data();
    if (!settings?.enabled || !settings.apiKey || !settings.domain) {
        throw new Error('Mailgun integration is not enabled or is missing API Key/Domain in Firestore.');
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
): Promise<{ success: boolean; error?: string; log?: string[] }> {
    if (!emailAddress || !inboxId) {
        return { success: false, error: 'Email address and Inbox ID are required.' };
    }
    
    const log: string[] = [];

    try {
        log.push("Action started.");
        const firestore = getAdminFirestore();
        log.push("Firebase Admin SDK initialized.");
        
        const { apiKey, domain } = await getMailgunCredentials(firestore);
        log.push("Successfully retrieved Mailgun credentials from Firestore.");

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });
        log.push("Mailgun client initialized.");

        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: "stored",
            limit: 30,
            begin: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(),
        });
        log.push(`Found ${events?.items?.length || 0} stored email events from Mailgun.`);
        
        if (!events?.items?.length) {
            return { success: true, log }; // No new mail, which is a success case.
        }

        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);

        for (const event of events.items) {
            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`Skipping event with no message-id: ${event.id}`);
                continue;
            }

            if (!event.storage || !event.storage.url) {
                log.push(`Skipping event with no storage URL: ${event.id}`);
                continue;
            }

            try {
                // Correctly parse the path from the storage URL
                const storagePath = new URL(event.storage.url).pathname;
                log.push(`Fetching email content from Mailgun storage path: ${storagePath}`);
                const messageDetails = await mg.get(storagePath);
                
                if (!messageDetails || !messageDetails.body) {
                    log.push(`Could not retrieve email body for event: ${event.id}`);
                    continue;
                };
                log.push(`Successfully fetched email content for event: ${event.id}`);
                
                const message = messageDetails.body;
                const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                const emailRef = emailsCollectionRef.doc(messageId);
                
                const emailData: Omit<Email, 'id'> = {
                    inboxId,
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
                log.push(`Prepared email ${messageId} for batch write.`);

            } catch(err: any) {
                log.push(`Failed to process and save email for event ${event.id}. Error: ${err.message}`);
                // Continue to next email instead of failing the whole action
            }
        }
        
        await batch.commit();
        log.push("Batch write committed to Firestore successfully.");
        
        return { success: true, log };

    } catch (error: any) {
        log.push(`[FATAL_ERROR]: ${error.message}`);
        console.error("[MAILGUN_ACTION_ERROR]", error);
        return { success: false, error: error.message || 'An unexpected server error occurred.', log };
    }
}
