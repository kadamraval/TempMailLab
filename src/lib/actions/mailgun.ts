
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getAdminFirestore } from '@/firebase/server-init';

/**
 * A secure server action that uses provided Mailgun credentials
 * to fetches emails for a given address, and then saves them to Firestore.
 */
export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    inboxId: string,
    apiKey: string | undefined,
    domain: string | undefined,
): Promise<{ success: boolean; error?: string }> {
    if (!emailAddress || !inboxId) {
        return { success: false, error: 'Email address and Inbox ID are required.' };
    }
    
    if (!apiKey || !domain) {
        return { success: false, error: 'Mailgun API Key and Domain are required. Please configure them in the admin settings.' };
    }

    try {
        const firestore = getAdminFirestore();
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: "stored",
            limit: 30,
            begin: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(),
        });
        
        const fetchedEmails: Email[] = [];

        if (events?.items?.length) {
            for (const event of events.items) {
                if (!event.storage || !event.storage.url) continue;

                try {
                    const messageDetails = await mg.get(event.storage.url.replace("https://api.mailgun.net/v3", ""));

                    if (!messageDetails || !messageDetails.body) continue;
                    
                    const message = messageDetails.body;
                    const cleanHtml = DOMPurify.sanitize(message['body-html'] || "");

                    fetchedEmails.push({
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
                } catch(err) {
                    // It's possible for a single email fetch to fail, log it but continue
                    console.warn(`Could not fetch email content for event ${event.id}. Skipping.`, err)
                }
            }
        }
        
        // If we found emails, save them to Firestore
        if (fetchedEmails.length > 0) {
            const batch = firestore.batch();
            const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);

            fetchedEmails.forEach((email) => {
                const emailRef = emailsCollectionRef.doc(email.id);
                const emailData = {
                    ...email,
                    htmlContent: email.htmlContent || "",
                    textContent: email.textContent || "",
                    rawContent: email.rawContent || "",
                    attachments: email.attachments || [],
                };
                batch.set(emailRef, emailData, { merge: true });
            });

            await batch.commit();
        }
        
        return { success: true };

    } catch (error: any) {
        console.error("[MAILGUN_ACTION_ERROR]", error);
        if (error.status === 401) {
            return { success: false, error: 'Mailgun authentication failed. Please check your API key.' };
        }
        if (error.message && error.message.includes('free accounts are for test purposes only')) {
             return { success: false, error: 'Your Mailgun account is a free test account. You may need to add authorized recipients in Mailgun settings.' };
        }
        return { success: false, error: error.message || 'An unexpected error occurred while fetching emails from Mailgun.' };
    }
}
