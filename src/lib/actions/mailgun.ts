
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

// All possible Mailgun API hosts.
const MAILGUN_API_HOSTS = ['api.mailgun.net', 'api.eu.mailgun.net'];

async function getMailgunCredentials() {
    const firestore = getAdminFirestore();
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        throw new Error('Mailgun settings not found. Please configure them in the admin dashboard.');
    }

    const settings = settingsSnap.data();
    if (!settings?.enabled || !settings.apiKey || !settings.domain) {
        throw new Error('Mailgun integration is not enabled or is missing API Key or Domain in Firestore.');
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

        const allEvents = [];
        // Correctly calculate the beginning timestamp as a UNIX number (seconds).
        const beginTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

        for (const host of MAILGUN_API_HOSTS) {
            log.push(`Querying Mailgun for 'accepted' events on host: ${host}...`);
            try {
                const mailgun = new Mailgun(formData);
                const mg = mailgun.client({ username: 'api', key: apiKey, host });
                
                const events = await mg.events.get(domain, {
                    // This is the correct event, as confirmed by all logs.
                    event: "accepted",
                    limit: 300, // Increased limit to be safe
                    begin: beginTimestamp,
                });

                if (events?.items?.length > 0) {
                    log.push(`Found ${events.items.length} 'accepted' events on ${host}.`);
                    allEvents.push(...events.items);
                } else {
                    log.push(`No 'accepted' events found on ${host}.`);
                }
            } catch (hostError: any) {
                // Correctly log and continue, do not throw an error.
                log.push(`[INFO] Could not fetch events from ${host}. This is expected if the region is not in use. Error: ${hostError.message}`);
            }
        }
        
        if (allEvents.length === 0) {
            log.push("No new mail events found across any region. Ending action.");
            return { success: true, log };
        }

        const firestore = getAdminFirestore();
        const batch = firestore.batch();
        const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);
        let newEmailsFound = 0;

        for (const event of allEvents) {
            // CRITICAL FIX: Use the reliable `recipient` field, not the complex `headers.to`.
            if (!event.recipient || event.recipient.toLowerCase() !== emailAddress.toLowerCase()) {
                continue; // Skip events not intended for the current inbox's email address
            }
            log.push(`Found relevant event for ${emailAddress}.`);

            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`[WARN] Skipping event with no message-id: ${event.id}`);
                continue;
            }

            const existingEmailRef = emailsCollectionRef.doc(messageId);
            const existingEmailSnap = await existingEmailRef.get();
            if (existingEmailSnap.exists) {
                log.push(`Skipping duplicate email: ${messageId}`);
                continue;
            }
            log.push(`Message ID: ${messageId} is not a duplicate.`);
            
            const storageUrl = event.storage?.url;
            if (!storageUrl) {
                log.push(`[WARN] Skipping event ${event.id} - no storage URL present.`);
                continue;
            }
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(storageUrl, {
                headers: {
                    // Correctly use Basic Authentication.
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
            
            // Correctly provide fallbacks for HTML and text content.
            const html = message["body-html"] || message["stripped-html"] || "";
            const cleanHtml = DOMPurify.sanitize(html);
            const text = message["stripped-text"] || message["body-plain"] || "No text content.";
            
            // Correctly handle different timestamp formats (seconds vs. milliseconds).
            const timestampMs = event.timestamp.toString().length === 10
                ? event.timestamp * 1000
                // @ts-ignore
                : event.timestamp;
            const receivedAt = Timestamp.fromDate(new Date(timestampMs));
            
            const emailData: Omit<Email, 'id'> = {
                inboxId,
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
        log.push(`[FATAL_ERROR]: ${error.message}`);
        console.error("[MAILGUN_ACTION_ERROR]", error);
        return { success: false, error: error.message || 'An unexpected server error occurred.', log };
    }
}
