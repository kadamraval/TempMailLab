'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getFirebaseAdmin } from '@/firebase/server-init';

/**
 * A secure server action that fetches the Mailgun credentials from admin-only
 * Firestore documents and then retrieves emails for a given address.
 * This action is the single, secure entry point for fetching emails.
 * @param emailAddress The temporary email address to fetch messages for.
 */
export async function fetchEmailsAction(
    emailAddress: string
): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
    if (!emailAddress) {
        return { success: false, error: 'Email address is required.' };
    }
    
    // Get Firebase Admin instances. This is a secure, server-only operation.
    const { firestore, error: adminError } = getFirebaseAdmin();

    if (adminError) {
        console.warn(`[MAILGUN_ACTION_WARNING] ${adminError.message}`);
        return { success: false, error: adminError.message };
    }

    try {
        // Fetch the Mailgun settings securely on the server.
        const settingsDoc = await firestore.collection('admin_settings').doc('mailgun').get();
        
        if (!settingsDoc.exists) {
             return { success: false, error: "Mailgun settings not found on the server." };
        }
        
        const settings = settingsDoc.data();
        const apiKey = settings?.apiKey;
        const domain = settings?.domain;
        const enabled = settings?.enabled;

        if (!enabled) {
            return { success: false, error: "Email fetching is disabled by the administrator." };
        }

        if (!apiKey || !domain) {
            return { success: false, error: 'Mailgun integration is not fully configured on the server.' };
        }

        // Proceed with fetching emails using the secure credentials.
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
