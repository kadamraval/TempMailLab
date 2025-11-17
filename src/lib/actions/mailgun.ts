
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

/**
 * A secure server action that uses provided Mailgun credentials
 * to fetches emails for a given address.
 * It now correctly fetches "accepted" events and then the full message
 * content for reliability. It is also robust against various email formats.
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

        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: "accepted",
            limit: 30
        });
        
        const emails: Email[] = [];

        if (events?.items?.length) {
            for (const event of events.items) {
                if (!event.storage || !event.storage.url) continue;

                const messageDetails = await mg.get(event.storage.url);
                if (!messageDetails || !messageDetails.body) continue;
                
                const message = messageDetails.body;
                
                // Sanitize HTML content, providing an empty string if it's nullish.
                const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                emails.push({
                    id: event.id,
                    recipient: emailAddress,
                    senderName: message.From || "Unknown Sender",
                    subject: message.Subject || "No Subject",
                    receivedAt: new Date(event.timestamp * 1000).toISOString(),
                    // Use fallback values for each part to prevent crashes
                    htmlContent: cleanHtml,
                    textContent: message["stripped-text"] || "",
                    rawContent: JSON.stringify(message, null, 2),
                    attachments: message.attachments || [],
                    read: false,
                });
            }
        }
        
        return { success: true, emails };

    } catch (error: any) {
        console.error("[MAILGUN_ACTION_ERROR]", error.message);
        return { success: false, error: 'An unexpected error occurred while fetching emails.' };
    }
}
