
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

interface Credentials {
    apiKey: string;
    domain: string;
}

/**
 * A secure server action that accepts Mailgun credentials as arguments
 * and fetches emails for a given address.
 * @param credentials The Mailgun API Key and Domain.
 * @param emailAddress The temporary email address to fetch messages for.
 */
export async function fetchEmailsWithCredentialsAction(
    credentials: Credentials,
    emailAddress: string
): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
    if (!emailAddress) {
        return { success: false, error: 'Email address is required.' };
    }
    
    const { apiKey, domain } = credentials;

    if (!apiKey || !domain) {
        return { success: false, error: 'Mailgun API Key and Domain are required.' };
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
        // Do not expose detailed internal errors to the client.
        return { success: false, error: 'An unexpected error occurred while fetching emails.' };
    }
}
