'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

/**
 * A secure server action that uses provided Mailgun credentials
 * to fetches emails for a given address.
 * It no longer fetches credentials itself, removing the failing dependency on the Firebase Admin SDK.
 */
export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    apiKey: string | undefined,
    domain: string | undefined,
): Promise<{ success: boolean; emails?: Email[]; error?: string }> {

    if (!emailAddress) {
        return { success: false, error: 'Email address is required.' };
    }
    
    if (!apiKey || !domain) {
        return { success: false, error: 'Mailgun API Key and Domain are required.' };
    }

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
