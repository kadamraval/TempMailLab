
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

const MAILGUN_API_HOSTS = {
    us: 'api.mailgun.net',
    eu: 'api.eu.mailgun.net',
};

async function getMailgunCredentials() {
    try {
        const firestore = getAdminFirestore();
        const settingsRef = firestore.doc('admin_settings/mailgun');
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) {
            throw new Error('Mailgun settings document not found. Please configure the Mailgun integration in the admin panel.');
        }

        const settings = settingsSnap.data();
        if (!settings?.apiKey || !settings.domain) {
            throw new Error('Mailgun API Key or Domain is missing from settings. Please check the configuration in the admin panel.');
        }

        return { apiKey: settings.apiKey, domain: settings.domain };
    } catch (error: any) {
        console.error('[MAILGUN_ACTION_ERROR] Failed to get credentials:', error);
        // Re-throw the error to be caught by the main action handler
        throw error;
    }
}

export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    inboxId: string,
    ownerToken?: string
): Promise<{ success: boolean; error?: string; log: string[] }> {
    const log: string[] = [`[${new Date().toLocaleTimeString()}] Action started for ${emailAddress}.`];
    
    if (!emailAddress || !inboxId) {
        const errorMsg = '[FATAL] Action failed: Missing email address or inbox ID.';
        log.push(errorMsg);
        console.error(errorMsg);
        return { success: false, error: 'Email address and Inbox ID are required.', log };
    }

    try {
        log.push("Attempting to retrieve Mailgun credentials...");
        const { apiKey, domain } = await getMailgunCredentials();
        log.push(`Credentials retrieved for domain: ${domain}.`);

        const firestore = getAdminFirestore();
        const inboxRef = firestore.doc(`inboxes/${inboxId}`);
        log.push(`Fetching inbox document: inboxes/${inboxId}`);
        const inboxSnap = await inboxRef.get();
        if (!inboxSnap.exists) {
            throw new Error(`Inbox with ID ${inboxId} not found.`);
        }
        const inboxData = inboxSnap.data();
        if (!inboxData) {
            throw new Error(`Could not retrieve data for inbox ${inboxId}.`);
        }
        const userId = inboxData.userId;
        log.push(`Inbox found. Operating for user ID: ${userId}`);

        const allEvents = [];
        // Check events from the last 24 hours
        const beginTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

        for (const [region, host] of Object.entries(MAILGUN_API_HOSTS)) {
            log.push(`Querying Mailgun '${region.toUpperCase()}' region for 'accepted' events on host: ${host}...`);
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
                    log.push(`Found ${events.items.length} 'accepted' event(s) in ${region.toUpperCase()} region.`);
                    allEvents.push(...events.items);
                } else {
                    log.push(`No 'accepted' events found in ${region.toUpperCase()} region for this recipient.`);
                }
            } catch (hostError: any) {
                // Log non-401 errors, as 401 (Unauthorized) is expected if the key isn't for this region.
                if (hostError.status !== 401) {
                     const errorMsg = `[WARN] Non-authentication error while querying ${host}: ${hostError.message}`;
                     log.push(errorMsg);
                     console.warn('[MAILGUN_ACTION_HOST_WARN]', { host, message: hostError.message, status: hostError.status });
                } else {
                    log.push(`[INFO] Key is not valid for ${region.toUpperCase()} region. This is expected if your account is in another region.`);
                }
            }
        }
        
        if (allEvents.length === 0) {
            log.push("No new mail events found across any region. Action complete.");
            return { success: true, log };
        }

        log.push(`Total events found: ${allEvents.length}. Processing each email.`);
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
                log.push(`[INFO] Skipping duplicate message ID: ${messageId}`);
                continue;
            }
            log.push(`Processing new message ID: ${messageId}.`);
            
            const storageUrl = event.storage?.url;
            if (!storageUrl) {
                log.push(`[WARN] Skipping event ${event.id} - no storage URL present.`);
                continue;
            }
            
            log.push(`Fetching content from storage URL...`);
            const fetch = (await import('node-fetch')).default;
            let response;
            try {
                response = await fetch(storageUrl, {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`
                    }
                });
            } catch (fetchError: any) {
                const errorMessage = `Failed to connect to Mailgun storage. Check network and DNS.`;
                console.error("[MAILGUN_ACTION_FETCH_ERROR]", { message: errorMessage, errorMessage: fetchError.message, url: storageUrl });
                throw new Error(errorMessage);
            }

            if (!response.ok) {
                const errorBody = await response.text();
                const errorMessage = `Failed to fetch Mailgun content. Status: ${response.status}. This likely means your Mailgun API Key is invalid or lacks permissions.`;
                 console.error("[MAILGUN_ACTION_FETCH_ERROR]", { message: errorMessage, status: response.status, body: errorBody, url: storageUrl });
                throw new Error(errorMessage);
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
            log.push("No new, unique emails needed to be written to the database.");
        }
        
        return { success: true, log };

    } catch (error: any) {
        const errorMessage = error.message || 'An unknown server error occurred.';
        log.push(`[FATAL_ERROR]: ${errorMessage}`);
        // This is the critical part: log the full error to Google Cloud Logging
        console.error("[MAILGUN_ACTION_ERROR]", {
            errorMessage: errorMessage,
            stack: error.stack,
            fullError: error
        });
        return { success: false, error: errorMessage, log };
    }
}
