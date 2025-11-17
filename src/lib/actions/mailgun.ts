
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getFirebaseAdmin } from '@/firebase/server-init';
import type { DocumentData } from 'firebase-admin/firestore';


async function getMailgunCredentials(): Promise<{ apiKey: string; domain: string } | null> {
    const { firestore, error: adminError } = getFirebaseAdmin();
    if (adminError) {
        console.error("Failed to initialize Firebase Admin SDK:", adminError.message);
        return null;
    }

    try {
        const settingsDoc = await firestore.collection('admin_settings').doc('mailgun').get();
        if (!settingsDoc.exists) {
            console.warn("Mailgun settings document does not exist.");
            return null;
        }

        const settings = settingsDoc.data() as DocumentData;
        if (!settings.enabled || !settings.apiKey || !settings.domain) {
            return null;
        }

        return { apiKey: settings.apiKey, domain: settings.domain };

    } catch (error) {
        console.error("Error fetching Mailgun credentials:", error);
        return null;
    }
}


/**
 * A secure server action that fetches Mailgun credentials from Firestore
 * and then fetches emails for a given address.
 */
export async function fetchEmailsWithCredentialsAction(
    emailAddress: string
): Promise<{ success: boolean; emails?: Email[]; error?: string }> {

    if (!emailAddress) {
        return { success: false, error: 'Email address is required.' };
    }

    const credentials = await getMailgunCredentials();
    if (!credentials) {
        return { success: false, error: 'Mailgun API Key and Domain are required and must be enabled in admin settings.' };
    }
    
    const { apiKey, domain } = credentials;

    try {
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        // Get the events for the recipient, specifically for "stored" messages.
        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: "stored",
            limit: 30
        });
        
        const emails: Email[] = [];

        if (events?.items?.length) {
            for (const event of events.items) {
                if (!event.storage || !event.storage.url) continue;

                // Fetch the full message content from the storage URL
                // The URL requires authentication, which the mg.get method handles.
                const messageDetails = await mg.get(event.storage.url);
                if (!messageDetails || !messageDetails.body) continue;
                
                const message = messageDetails.body;
                
                // Sanitize the HTML content to prevent XSS attacks
                const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                emails.push({
                    id: event.id,
                    recipient: emailAddress,
                    senderName: message.From || "Unknown Sender",
                    subject: message.Subject || "No Subject",
                    receivedAt: new Date(event.timestamp * 1000).toISOString(),
                    htmlContent: cleanHtml,
                    textContent: message["stripped-text"] || "",
                    rawContent: JSON.stringify(message, null, 2), // Full raw content for source view
                    attachments: message.attachments || [],
                    read: false,
                });
            }
        }
        
        return { success: true, emails };

    } catch (error: any) {
        console.error("[MAILGUN_ACTION_ERROR]", error.message);
        // Do not expose detailed internal errors to the client.
        return { success: false, error: 'An unexpected error occurred while fetching emails.' };
    }
}
