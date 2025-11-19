
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
        throw new Error('Mailgun integration is not enabled or is missing API Key or Domain in Firestore.');
    }

    const host = settings.region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';

    return { apiKey: settings.apiKey, domain: settings.domain, host };
}

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
        const { apiKey, domain, host } = await getMailgunCredentials();
        log.push(`Successfully retrieved Mailgun credentials. Using host: ${host}`);

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey, host });
        log.push("Mailgun client initialized. Fetching 'accepted' events...");

        const events = await mg.events.get(domain, {
            event: "accepted",
            limit: 30,
            begin: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(), 
        });
        log.push(`Found ${events?.items?.length || 0} 'accepted' events for the whole domain.`);
        
        if (!events?.items?.length) {
            log.push("No new mail events found. Ending action.");
            return { success: true, log };
        }

        const firestore = getAdminFirestore();
        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);
        let newEmailsFound = 0;

        for (const event of events.items) {
            // ** LOGIC CORRECTION: Filter by recipient *first* for efficiency and correctness. **
            if (!event.message?.headers?.to || !event.message.headers.to.includes(emailAddress)) {
                continue;
            }
            log.push(`Found relevant event for ${emailAddress}.`);
            
            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`Skipping event with no message-id: ${event.id}`);
                continue;
            }

            // ** LOGIC CORRECTION: Check for duplicates using the correct doc().get() method. **
            const existingEmailRef = emailsCollectionRef.doc(messageId);
            const existingEmailSnap = await existingEmailRef.get();
            if (existingEmailSnap.exists) {
                continue; // Skip if email already exists
            }
            log.push(`Message ID: ${messageId}. Not a duplicate. Proceeding...`);

            // ** LOGIC CORRECTION: Correctly get the URL from the array. **
            const storageUrl = event.storage?.url?.[0];
            if (!storageUrl) {
                log.push(`[WARN] Skipping event ${event.id} - no storage URL present.`);
                continue;
            }

            try {
                const fetch = (await import('node-fetch')).default;
                
                // ** LOGIC CORRECTION: Use Basic Auth header, do not rewrite URL. **
                const response = await fetch(storageUrl, {
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
                
                // ** LOGIC CORRECTION: Use multiple fallbacks for HTML body. **
                const html = message["body-html"] || message["HtmlBody"] || message["stripped-html"] || "";
                const cleanHtml = DOMPurify.sanitize(html);
                
                // ** LOGIC CORRECTION: Correctly handle both timestamp formats. **
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
            log.push("No new emails for this specific address needed to be written to the database.");
        }
        
        return { success: true, log };

    } catch (error: any) {
        log.push(`[FATAL_ERROR]: ${error.message}`);
        console.error("[MAILGUN_ACTION_ERROR]", error);
        return { success: false, error: error.message || 'An unexpected server error occurred.', log };
    }
}
