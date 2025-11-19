
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

// A definitive list of all possible Mailgun API hosts.
const MAILGUN_API_HOSTS = ['api.mailgun.net', 'api.eu.mailgun.net'];

async function getMailgunCredentials() {
    const firestore = getAdminFirestore();
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        throw new Error('Mailgun settings not found in Firestore at admin_settings/mailgun.');
    }

    const settings = settingsSnap.data();
    if (!settings?.apiKey || !settings.domain) {
        throw new Error('Mailgun integration is missing API Key or Domain in Firestore.');
    }

    return { apiKey: settings.apiKey, domain: settings.domain };
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
        const { apiKey, domain } = await getMailgunCredentials();
        log.push(`Successfully retrieved Mailgun credentials for domain: ${domain}.`);

        const firestore = getAdminFirestore();
        const inboxRef = firestore.doc(`inboxes/${inboxId}`);
        const inboxSnap = await inboxRef.get();
        if (!inboxSnap.exists) {
            throw new Error(`Inbox with ID ${inboxId} not found.`);
        }
        const inboxData = inboxSnap.data();
        if (!inboxData) {
            throw new Error(`Could not retrieve data for inbox ${inboxId}.`);
        }
        const userId = inboxData.userId;
        log.push(`Operating for user ID: ${userId}`);


        const allEvents = [];
        const beginTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

        for (const host of MAILGUN_API_HOSTS) {
            log.push(`Querying Mailgun for 'accepted' events on host: ${host}...`);
            try {
                const mailgun = new Mailgun(formData);
                const mg = mailgun.client({ username: 'api', key: apiKey, host });
                
                const events = await mg.events.get(domain, {
                    event: "accepted",
                    limit: 300,
                    begin: beginTimestamp,
                    recipient: emailAddress,
                });

                if (events?.items?.length > 0) {
                    log.push(`Found ${events.items.length} 'accepted' events on ${host}.`);
                    allEvents.push(...events.items);
                } else {
                    log.push(`No 'accepted' events found on ${host} for this recipient.`);
                }
            } catch (hostError: any) {
                log.push(`[INFO] Could not fetch events from ${host}. Error: ${hostError.message}`);
            }
        }
        
        if (allEvents.length === 0) {
            log.push("No new mail events found across any region. Ending action.");
            return { success: true, log };
        }

        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);
        let newEmailsFound = 0;

        for (const event of allEvents) {
            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`[WARN] Skipping event with no message-id: ${event.id}`);
                continue;
            }

            const existingEmailRef = emailsCollectionRef.doc(messageId);
            const existingEmailSnap = await existingEmailRef.get();
            if (existingEmailSnap.exists) {
                continue;
            }
            log.push(`Message ID: ${messageId} is not a duplicate.`);
            
            const storageUrl = Array.isArray(event.storage?.url) ? event.storage.url[0] : event.storage?.url;
            if (!storageUrl) {
                log.push(`[WARN] Skipping event ${event.id} - no storage URL present.`);
                continue;
            }
            
            const fetch = (await import('node-fetch')).default;
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

            const message = await response.json() as any;
            log.push(`Successfully fetched email content for event: ${event.id}`);
            
            const html = message["body-html"] || message["stripped-html"] || "";
            const cleanHtml = DOMPurify.sanitize(html);
            const text = message["stripped-text"] || message["body-plain"] || "No text content.";
            
            const timestampMs = event.timestamp * 1000;
            const receivedAt = Timestamp.fromDate(new Date(timestampMs));
            
            const emailData: Omit<Email, 'id'> = {
                inboxId,
                userId: userId,
                recipient: emailAddress,
                senderName: message.From || "Unknown Sender",
                subject: message.Subject || "No Subject",
                receivedAt: receivedAt,
                htmlContent: cleanHtml,
                textContent: text,
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
        }
        
        if (newEmailsFound > 0) {
            await batch.commit();
            log.push(`SUCCESS: Batch write committed to Firestore with ${newEmailsFound} new email(s).`);
        } else {
            log.push("No new, unique emails for this address needed to be written to the database.");
        }
        
        return { success: true, log };

    } catch (error: any) {
        const errorMessage = `[FATAL_ERROR]: ${error.message}`;
        log.push(errorMessage);
        console.error("[MAILGUN_ACTION_ERROR]", error);
        return { success: false, error: error.message || 'An unexpected server error occurred.', log };
    }
}
