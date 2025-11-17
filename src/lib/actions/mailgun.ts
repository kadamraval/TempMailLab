
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

/**
 * A secure server action that uses provided Mailgun credentials
 * to fetches emails for a given address.
 * It now correctly fetches "stored" events and then the full message
 * content for reliability.
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
        return { success: false, error: 'Mailgun API Key and Domain are required. Please configure them in the admin settings.' };
    }

    try {
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        // 1. Fetch 'stored' events for the specific recipient.
        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: "stored", // Critical: We only care about emails that Mailgun has stored.
            limit: 30,
            // We only need events from the last day for performance.
            begin: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(),
        });
        
        const emails: Email[] = [];

        if (events?.items?.length) {
            for (const event of events.items) {
                // 2. Ensure the event has a storage URL.
                if (!event.storage || !event.storage.url) continue;

                // 3. Fetch the full message content from the storage URL.
                // The URL needs to be accessed with the API client to handle auth.
                const messageDetails = await mg.get(event.storage.url.replace("https://api.mailgun.net/v3", ""));

                if (!messageDetails || !messageDetails.body) continue;
                
                const message = messageDetails.body;
                
                // 4. Sanitize HTML content to prevent XSS attacks.
                const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                // 5. Build the final email object.
                emails.push({
                    id: event.id,
                    recipient: emailAddress,
                    senderName: message.From || "Unknown Sender",
                    subject: message.Subject || "No Subject",
                    receivedAt: new Date(event.timestamp * 1000).toISOString(),
                    htmlContent: cleanHtml,
                    textContent: message["stripped-text"] || "No text content.",
                    rawContent: JSON.stringify(message, null, 2),
                    attachments: message.attachments || [],
                    read: false,
                });
            }
        }
        
        return { success: true, emails };

    } catch (error: any) {
        console.error("[MAILGUN_ACTION_ERROR]", error);
        // Provide more specific error feedback
        if (error.status === 401) {
            return { success: false, error: 'Mailgun authentication failed. Please check your API key.' };
        }
        if (error.message.includes('free accounts are for test purposes only')) {
             return { success: false, error: 'Your Mailgun account is a free test account. You may need to add authorized recipients in Mailgun settings.' };
        }
        return { success: false, error: 'An unexpected error occurred while fetching emails from Mailgun.' };
    }
}
