
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

async function getMailgunCredentials() {
    const firestore = getAdminFirestore();
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        throw new Error('Mailgun settings not found in admin_settings/mailgun. Please configure it in the admin dashboard.');
    }

    const settings = settingsSnap.data();
    if (!settings?.enabled || !settings.apiKey || !settings.domain) {
        throw new Error('Mailgun integration is not enabled or is missing API Key/Domain in Firestore.');
    }

    return { apiKey: settings.apiKey, domain: settings.domain };
}


/**
 * A secure server action that fetches emails for a given address
 * and then saves them to Firestore. It securely retrieves Mailgun
 * credentials from admin settings.
 */
export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    inboxId: string,
    ownerToken?: string
): Promise<{ success: boolean; error?: string; log: string[] }> {
    if (!emailAddress || !inboxId) {
        return { success: false, error: 'Email address and Inbox ID are required.', log: ['Action failed: Missing email address or inbox ID.'] };
    }
    
    const log: string[] = [`[${new Date().toLocaleTimeString()}] Action started for ${emailAddress}.`];

    try {
        const { apiKey, domain } = await getMailgunCredentials();
        log.push("Successfully retrieved Mailgun credentials from Firestore.");

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });
        log.push("Mailgun client initialized.");

        // FIX 1: Query all 'stored' events for the domain and filter manually.
        const events = await mg.events.get(domain, {
            event: "stored",
            limit: 30, // Limit to recent events to avoid large payloads
            begin: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(), // Check last 24 hours
        });
        log.push(`Found ${events?.items?.length || 0} 'stored' events from Mailgun for the whole domain.`);
        
        if (!events?.items?.length) {
            log.push("No new mail events found. Ending action.");
            return { success: true, log }; // No new mail, which is a success case.
        }

        const firestore = getAdminFirestore();
        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);
        let newEmailsFound = 0;

        for (const event of events.items) {
            // Manual filtering for the correct recipient
            if (!event.message?.headers?.to || !event.message.headers.to.includes(emailAddress)) {
                continue;
            }

            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`Skipping event with no message-id: ${event.id}`);
                continue;
            }

            // FIX 3: Correct duplicate detection by checking document existence directly.
            const existingEmailRef = emailsCollectionRef.doc(messageId);
            const existingEmailSnap = await existingEmailRef.get();
            if (existingEmailSnap.exists) {
                // This is not an error, just skipping a duplicate.
                continue;
            }
            log.push(`Event for ${emailAddress} found. Message ID: ${messageId}. Not a duplicate.`);

            if (!event.storage || !event.storage.url) {
                log.push(`[ERROR] Skipping event with no storage URL: ${event.id}`);
                continue;
            }

            try {
                // FIX 2: Correctly fetch stored email using Basic Auth header.
                const fetch = (await import('node-fetch')).default;
                const response = await fetch(event.storage.url, {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`
                    }
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    log.push(`[ERROR] Failed to fetch content for event ${event.id}. Status: ${response.status}. Body: ${errorBody}`);
                    continue;
                }

                const message = await response.json();
                log.push(`Successfully fetched email content for event: ${event.id}`);
                
                // FIX 5: Use fallbacks for HTML body.
                const html = message["body-html"] || message["HtmlBody"] || message["stripped-html"] || "";
                const cleanHtml = DOMPurify.sanitize(html);

                // FIX 4: Correctly handle both UNIX and JS timestamps.
                const timestampMs = event.timestamp.toString().length === 10
                    ? event.timestamp * 1000
                    : event.timestamp;
                const receivedAt = Timestamp.fromDate(new Date(timestampMs));
                
                const emailData: Email = {
                    id: messageId,
                    inboxId,
                    recipient: emailAddress,
                    senderName: message.From || "Unknown Sender",
                    subject: message.Subject || "No Subject",
                    receivedAt: receivedAt,
                    htmlContent: cleanHtml,
                    textContent: message["stripped-text"] || message["body-plain"] || "No text content.",
                    rawContent: JSON.stringify(message, null, 2),
                    attachments: message.attachments || [],
                    read: false,
                };
                
                if (ownerToken) {
                    emailData.ownerToken = ownerToken;
                }

                batch.set(existingEmailRef, emailData);
                newEmailsFound++;
                log.push(`Prepared email ${messageId} for batch write.`);

            } catch(err: any) {
                log.push(`[ERROR] Failed to process and save email for event ${event.id}. Error: ${err.message}`);
            }
        }
        
        if (newEmailsFound > 0) {
            await batch.commit();
            log.push(`Batch write committed to Firestore with ${newEmailsFound} new email(s).`);
        } else {
            log.push("No new emails needed to be written to the database.");
        }
        
        return { success: true, log };

    } catch (error: any) {
        log.push(`[FATAL_ERROR]: ${error.message}`);
        console.error("[MAILGUN_ACTION_ERROR]", error);
        return { success: false, error: error.message || 'An unexpected server error occurred.', log };
    }
}
