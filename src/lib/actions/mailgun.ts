
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

// This is a new, simplified server action that takes credentials as arguments.
// It no longer depends on the Firebase Admin SDK to fetch settings.
export async function fetchEmailsWithCredentialsAction(
    apiKey: string,
    domain: string,
    emailAddress: string
): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
    if (!apiKey || !domain || !emailAddress) {
        return { success: false, error: 'Missing required credentials or email address.' };
    }

    try {
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        const events = await mg.events.get(domain, {
            "to": emailAddress,
            "event": "stored",
            "limit": 30
        });

        const emails: Email[] = [];

        if (events?.items?.length) {
             for (const event of events.items) {
                const message = event.message;
                if (!message || !message.headers) continue;
                
                const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                emails.push({
                    id: event.id,
                    recipient: emailAddress,
                    senderName: message.headers.from || "Unknown Sender",
                    subject: message.headers.subject || "No Subject",
                    receivedAt: new Date(event.timestamp * 1000).toISOString(),
                    htmlContent: cleanHtml,
                    textContent: message["stripped-text"] || "",
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
