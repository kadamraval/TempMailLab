
'use server';

import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Email } from '@/types';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

// Standard Mailgun API hosts.
const MAILGUN_API_HOSTS = {
    us: 'api.mailgun.net',
    eu: 'api.eu.mailgun.net',
};

async function getMailgunCredentials(log: string[]) {
    try {
        const firestore = getAdminFirestore();
        const settingsRef = firestore.doc('admin_settings/mailgun');
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) {
            throw new Error('Mailgun settings document not found in Firestore. Please configure it in the admin panel.');
        }

        const settings = settingsSnap.data();
        if (!settings?.apiKey || !settings.domain) {
            throw new Error('Mailgun API Key or Domain is missing from settings. Please check the configuration.');
        }
        
        log.push("Successfully retrieved Mailgun credentials.");
        return { apiKey: settings.apiKey, domain: settings.domain };
    } catch (error: any) {
        // This is a critical failure. Log it and re-throw.
        console.error("[MAILGUN_ACTION_ERROR] FATAL: Could not get Mailgun credentials.", {
            errorMessage: error.message,
            stack: error.stack,
        });
        log.push(`[FATAL] Could not get Mailgun credentials: ${error.message}`);
        throw error;
    }
}

export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    inboxId: string,
    ownerToken?: string
): Promise<{ success: boolean; error?: string; log: string[] }> {
    const log: string[] = [`[${new Date().toLocaleTimeString()}] Action started for ${emailAddress}.`];
    
    // --- ADMIN SDK DIAGNOSTIC TEST ---
    try {
        getAdminFirestore();
        console.log("[ADMIN_SDK_TEST] SUCCESS: Firebase Admin SDK initialized successfully.");
    } catch (e: any) {
        console.error("[ADMIN_SDK_TEST] FAILURE: Could not initialize Firebase Admin SDK.", e);
        const errorMsg = "Server is not configured for backend operations. Admin SDK failed to initialize.";
        return { success: false, error: errorMsg, log: [errorMsg] };
    }
    // --- END DIAGNOSTIC TEST ---

    if (!emailAddress || !inboxId) {
        const errorMsg = '[FATAL] Action failed: Missing email address or inbox ID.';
        log.push(errorMsg);
        console.error(errorMsg);
        return { success: false, error: 'Email address and Inbox ID are required.', log };
    }

    try {
        const { apiKey, domain } = await getMailgunCredentials(log);
        const firestore = getAdminFirestore();

        const inboxRef = firestore.doc(`inboxes/${inboxId}`);
        const inboxSnap = await inboxRef.get();
        if (!inboxSnap.exists) throw new Error(`Inbox with ID ${inboxId} not found.`);
        const userId = inboxSnap.data()?.userId;
        if (!userId) throw new Error(`Could not retrieve user ID for inbox ${inboxId}.`);
        log.push(`Inbox found. Operating for user ID: ${userId}`);
        
        const allEvents = [];
        const beginTimestamp = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

        for (const [region, host] of Object.entries(MAILGUN_API_HOSTS)) {
            log.push(`Querying Mailgun '${region.toUpperCase()}' region for "stored" events...`);
            try {
                const mailgun = new Mailgun(formData);
                const mg = mailgun.client({ username: 'api', key: apiKey, host });
                
                const events = await mg.events.get(domain, {
                    event: "stored",
                    limit: 300,
                    begin: beginTimestamp,
                    recipient: emailAddress,
                });

                if (events?.items?.length > 0) {
                    log.push(`Found ${events.items.length} "stored" event(s) in ${region.toUpperCase()}.`);
                    allEvents.push(...events.items);
                } else {
                    log.push(`No "stored" events found in ${region.toUpperCase()}.`);
                }
            } catch (hostError: any) {
                 if (hostError.status !== 401) { 
                    console.error(`[MAILGUN_ACTION_ERROR] Error querying Mailgun region '${region.toUpperCase()}'.`, {
                        region, host, status: hostError.status, message: hostError.message
                    });
                    log.push(`[ERROR] Failed to query ${region.toUpperCase()} region: ${hostError.message}`);
                 } else {
                    log.push(`[INFO] Key not valid for ${region.toUpperCase()} region.`);
                 }
            }
        }
        
        if (allEvents.length === 0) {
            log.push("No new 'stored' mail events found across all regions. Action complete.");
            return { success: true, log };
        }

        log.push(`Total "stored" events found: ${allEvents.length}. Processing each email.`);
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
            if (existingEmailSnap.exists) continue;
            
            const storageUrl = event.storage?.url;
            if (!storageUrl) {
                log.push(`[WARN] Skipping event ${event.id} - no storage URL present.`);
                continue;
            }
            
            log.push(`Fetching content for message ${messageId}...`);
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(storageUrl, {
                headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch content from Mailgun storage for message ${messageId}. Status: ${response.status}. This likely means your Mailgun API Key is invalid or lacks permissions.`);
            }
            
            const message = await response.json() as any;
            const cleanHtml = DOMPurify.sanitize(message["body-html"] || message["stripped-html"] || "");
            
            const emailData: Omit<Email, 'id'> = {
                inboxId,
                userId: userId,
                recipient: emailAddress,
                senderName: message.From || "Unknown Sender",
                subject: message.Subject || "No Subject",
                receivedAt: Timestamp.fromMillis(event.timestamp * 1000),
                htmlContent: cleanHtml,
                textContent: message["stripped-text"] || message["body-plain"] || "No text content.",
                rawContent: JSON.stringify(message, null, 2),
                attachments: message.attachments || [],
                read: false,
                ...(ownerToken && { ownerToken }),
            };
            
            batch.set(existingEmailRef, emailData);
            newEmailsFound++;
            log.push(`Prepared email ${messageId} for batch write.`);
        }
        
        if (newEmailsFound > 0) {
            try {
                await batch.commit();
                log.push(`SUCCESS: Batch write of ${newEmailsFound} new email(s) committed to Firestore.`);
            } catch (dbError: any) {
                console.error("[MAILGUN_ACTION_ERROR] FATAL: Firestore batch commit failed.", {
                    errorMessage: dbError.message,
                    errorDetails: dbError.details,
                    stack: dbError.stack,
                });
                log.push(`[FATAL_DB_ERROR] Could not save emails to database: ${dbError.message}`);
                throw dbError;
            }
        } else {
            log.push("No new, unique emails needed to be written to the database.");
        }
        
        return { success: true, log };

    } catch (error: any) {
        console.error("[MAILGUN_ACTION_ERROR] An unexpected error occurred in the main action handler.", {
            errorMessage: error.message,
            stack: error.stack,
        });
        log.push(`[FATAL_ERROR]: ${error.message}`);
        return { success: false, error: error.message || 'An unknown server error occurred.', log };
    }
}
