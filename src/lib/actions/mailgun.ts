
'use server';

import { initializeFirebase } from '@/firebase/server-init';
import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';

async function getMailgunSettings() {
    const { firestore } = initializeFirebase(); // This will throw if not configured
    const settingsRef = firestore.collection("admin_settings").doc("mailgun");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        throw new Error("Mailgun integration settings not found. Please configure them in the admin panel.");
    }

    const settings = settingsSnap.data();
    
    if (!settings || !settings.enabled || !settings.apiKey || !settings.domain) {
        throw new Error("Mailgun integration is not enabled or settings are incomplete. Please check the admin panel.");
    }
    
    return {
        apiKey: settings.apiKey,
        domain: settings.domain,
    };
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
        console.error("Error in fetchEmailsFromServerAction:", error);
         // Provide a more specific error message if initialization failed.
        if (error.message.includes("Firebase Admin SDK is not available")) {
            return {
                error: "Server-side Firebase is not configured. Cannot fetch emails."
            }
        }
        return { error: error.message || 'An unexpected error occurred while fetching emails.' };
    }
}
