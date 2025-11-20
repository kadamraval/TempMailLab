
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';
import type { Email, Inbox } from '@/types';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import DOMPurify from 'isomorphic-dompurify';

async function getMailgunSettings() {
    const firestore = getAdminFirestore();
    const settingsDoc = await firestore.doc('admin_settings/mailgun').get();
    if (!settingsDoc.exists) {
        throw new Error("Mailgun settings are not configured in the admin panel.");
    }
    return settingsDoc.data();
}

/**
 * Fetches new emails for a given address from Mailgun's events API and stores them in Firestore.
 * @param emailAddress The temporary email address to check.
 * @param inboxId The ID of the inbox in Firestore.
 * @param userId The ID of the user who owns the inbox.
 * @returns A result object indicating success or failure.
 */
export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; log: string[] }> {
    const log: string[] = [];
    log.push(`[1/6] Starting email fetch for ${emailAddress}`);

    try {
        const mailgunSettings = await getMailgunSettings();
        if (!mailgunSettings?.apiKey || !mailgunSettings?.domain) {
            throw new Error("Mailgun API key or domain is not configured.");
        }
        
        log.push("[2/6] Mailgun settings retrieved successfully.");

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: mailgunSettings.apiKey });

        const firestore = getAdminFirestore();
        const eventsResponse = await mg.events.get(mailgunSettings.domain, {
            recipient: emailAddress,
            event: 'stored',
            limit: 25,
        });

        log.push(`[3/6] Found ${eventsResponse.items.length} 'stored' events from Mailgun.`);
        
        if (eventsResponse.items.length === 0) {
            return { success: true, log, message: "No new emails found." };
        }

        for (const event of eventsResponse.items) {
            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`Skipping event with no message-id.`);
                continue;
            }

            const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
            const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
            const emailDoc = await emailRef.get();

            if (emailDoc.exists) {
                log.push(`[4/6] Email ${emailDocId} already exists. Skipping.`);
                continue; // Skip already processed emails
            }

            log.push(`[4/6] Processing new email with Message-ID: ${messageId}`);
            
            // Fetch the full stored message from Mailgun using the storage URL
            const messageResponse = await mg.messages.get(event.storage.url);
            
            const htmlBody = messageResponse['body-html'] || messageResponse['stripped-html'] || "";
            const cleanHtml = DOMPurify.sanitize(htmlBody, { USE_PROFILES: { html: true } });

            const emailData: Omit<Email, 'id'> = {
                inboxId: inboxId,
                userId: userId,
                senderName: messageResponse.From || "Unknown Sender",
                subject: messageResponse.Subject || "No Subject",
                receivedAt: Timestamp.fromMillis(event.timestamp * 1000),
                createdAt: Timestamp.now(),
                htmlContent: cleanHtml,
                textContent: messageResponse['stripped-text'] || messageResponse['body-plain'] || "No text content.",
                rawContent: JSON.stringify(messageResponse, null, 2),
                read: false,
            };
            
            log.push(`[5/6] Saving new email to path: ${emailRef.path}`);
            await emailRef.set(emailData);
            log.push(`[5/6] Email saved successfully.`);
        }
        
        log.push("[6/6] Email fetch and store process completed.");
        return { success: true, log };

    } catch (error: any) {
        log.push(`[ERROR] ${error.message}`);
        console.error("fetchAndStoreEmailsAction Error:", error);
        return { success: false, error: error.message || 'An unknown error occurred.', log };
    }
}
