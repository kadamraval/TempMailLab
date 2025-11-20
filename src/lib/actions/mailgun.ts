
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import type { Email } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';
import DOMPurify from 'isomorphic-dompurify';

async function getMailgunKeys() {
    const db = getAdminFirestore();
    const settingsDoc = await db.doc('admin_settings/mailgun').get();
    if (!settingsDoc.exists) {
        throw new Error('Mailgun settings are not configured in the admin panel.');
    }
    const { apiKey, domain } = settingsDoc.data() || {};
    if (!apiKey || !domain) {
        throw new Error('Mailgun API key or domain is missing from settings.');
    }
    return { apiKey, domain };
}

export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string) {
    const log: string[] = [];
    try {
        log.push("Starting email fetch process...");
        const { apiKey, domain } = await getMailgunKeys();
        log.push(`Keys retrieved for domain: ${domain}`);
        
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        log.push(`Fetching events for recipient: ${emailAddress}`);
        const events = await mg.events.get(domain, {
            recipient: emailAddress,
            event: 'stored',
        });
        
        log.push(`Found ${events.items.length} 'stored' events.`);

        if (events.items.length === 0) {
            return { success: true, log, message: "No new emails found." };
        }

        const db = getAdminFirestore();
        let newEmailsCount = 0;

        for (const event of events.items) {
            if (!event.storage || !event.storage.url) {
                log.push(`Skipping event ${event.id}: No storage URL.`);
                continue;
            }

            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) {
                log.push(`Skipping event ${event.id}: No Message-ID header.`);
                continue;
            }

            const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/]/g, '_');
            const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
            const emailDoc = await emailRef.get();

            if (emailDoc.exists) {
                log.push(`Skipping email ${emailDocId}: Already exists in inbox ${inboxId}.`);
                continue;
            }

            log.push(`Fetching full email content for ${emailDocId} from ${event.storage.url}`);
            const emailContent = await mg.messages.get(event.storage.url);
            
            if (!emailContent) {
                log.push(`Failed to fetch email content for ${emailDocId}.`);
                continue;
            }
            
            const htmlBody = emailContent['body-html'] || emailContent['stripped-html'] || '';
            const cleanHtml = DOMPurify.sanitize(htmlBody);

            const emailData: Omit<Email, "id"> = {
                inboxId: inboxId,
                userId: userId,
                senderName: emailContent.From || "Unknown Sender",
                subject: emailContent.Subject || "No Subject",
                receivedAt: Timestamp.fromMillis(event.timestamp * 1000),
                createdAt: Timestamp.now(),
                htmlContent: cleanHtml,
                textContent: emailContent['stripped-text'] || emailContent['body-plain'] || "No text content.",
                rawContent: JSON.stringify(emailContent, null, 2),
                read: false,
                attachments: (emailContent.attachments || []).map((att: any) => ({
                    filename: att.filename,
                    "content-type": att['content-type'],
                    size: att.size,
                    url: att.url // This may need adjustment based on SDK version
                })),
            };

            await emailRef.set(emailData);
            log.push(`SUCCESS: Saved email ${emailDocId} to inbox ${inboxId}.`);
            newEmailsCount++;
        }

        return { success: true, log, message: `Successfully processed and stored ${newEmailsCount} new emails.` };

    } catch (error: any) {
        log.push(`FATAL ERROR: ${error.message}`);
        console.error("[fetchAndStoreEmailsAction FATAL ERROR]", {
            message: error.message,
            stack: error.stack,
        });
        return { success: false, error: error.message, log };
    }
}
