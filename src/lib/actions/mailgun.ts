
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

async function getMailgunSettings() {
    const { firestore, error: adminError } = getFirebaseAdmin();
    
    if (adminError) {
        // This is a configuration error on the server, re-throw it to be caught by the main action.
        // This error now originates from a non-crashing initialization.
        throw adminError;
    }
    
    try {
        const settingsRef = firestore.collection("admin_settings").doc("mailgun");
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) {
            throw new Error("Mailgun integration settings not found in the database. Please configure it in the admin panel.");
        }

        const settings = settingsSnap.data();
        
        if (!settings || !settings.enabled || !settings.apiKey || !settings.domain) {
            throw new Error("Mailgun integration is not fully configured or is disabled in the admin panel.");
        }
        
        return {
            apiKey: settings.apiKey,
            domain: settings.domain,
        };
    } catch (error: any) {
        // Re-throw any other error to be handled by the caller.
        throw error;
    }
}

export async function fetchEmailsFromServerAction(
    sessionId: string,
    emailAddress: string
) {
    if (!sessionId || !emailAddress) {
        return { error: 'Invalid session or email address provided.' };
    }
    
    try {
        const { apiKey, domain } = await getMailgunSettings();

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
        // Log the actual error on the server for debugging
        console.error("[MAILGUN_ACTION_ERROR]", error.message);
        // Return a generic but informative message to the client.
        // The specific FIREBASE_SERVICE_ACCOUNT message will be passed through from the error thrown by getFirebaseAdmin.
        return { error: error.message || 'An unexpected error occurred while fetching emails.' };
    }
}
