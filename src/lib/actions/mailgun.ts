'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';
import type { Email } from '@/types';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { simpleParser } from 'mailparser';

async function getMailgunSettings() {
    const firestore = getAdminFirestore();
    const settingsDoc = await firestore.doc('admin_settings/mailgun').get();
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        throw new Error("Mailgun integration is not configured or enabled in the admin panel.");
    }
    return settingsDoc.data();
}

/**
 * Fetches new emails for a given address from Mailgun's events API and stores them in Firestore.
 * This is a more robust implementation that fetches the full raw MIME message for parsing.
 * @param emailAddress The temporary email address to check.
 * @param inboxId The ID of the inbox in Firestore.
 * @param userId The ID of the user who owns the inbox.
 * @returns A result object indicating success or failure.
 */
export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    try {
        const mailgunSettings = await getMailgunSettings();
        if (!mailgunSettings?.apiKey || !mailgunSettings?.domain) {
            throw new Error("Mailgun API key or domain is missing from settings.");
        }

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: mailgunSettings.apiKey });

        const firestore = getAdminFirestore();
        
        // 1. Get 'stored' events from Mailgun
        const eventsResponse = await mg.events.get(mailgunSettings.domain, {
            recipient: emailAddress,
            event: 'stored',
            limit: 25, // Fetch up to 25 recent events
        });

        if (eventsResponse.items.length === 0) {
            return { success: true, message: "No new emails found." };
        }
        
        let newEmailsFound = 0;

        // 2. Process each event
        for (const event of eventsResponse.items) {
            const messageId = event.message?.headers?.['message-id'];
            if (!messageId) continue;

            // Use a sanitized message-id as the document ID to prevent duplicates
            const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
            const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
            const emailDoc = await emailRef.get();

            if (emailDoc.exists) continue; // Skip already processed emails

            // 3. Fetch the full, raw message from the storage URL
            const rawMessage = await mg.messages.get(event.storage.url, { raw: true });
            
            // 4. Parse the raw MIME message using mailparser
            const parsedEmail = await simpleParser(rawMessage);

            const emailData: Omit<Email, 'id'> = {
                inboxId: inboxId,
                userId: userId, // CRITICAL: Stamp the userId for security rules
                senderName: parsedEmail.from?.text || "Unknown Sender",
                subject: parsedEmail.subject || "No Subject",
                receivedAt: parsedEmail.date ? Timestamp.fromDate(parsedEmail.date) : Timestamp.fromMillis(event.timestamp * 1000),
                createdAt: Timestamp.now(),
                htmlContent: typeof parsedEmail.html === 'string' ? parsedEmail.html : "",
                textContent: parsedEmail.text || "",
                rawContent: rawMessage, // Store the raw content for source view
                read: false,
                attachments: parsedEmail.attachments ? parsedEmail.attachments.map(att => ({
                    filename: att.filename || 'attachment',
                    contentType: att.contentType,
                    size: att.size,
                    url: '' 
                })) : []
            };
            
            await emailRef.set(emailData);
            newEmailsFound++;
        }
        
        return { success: true, message: newEmailsFound > 0 ? `Fetched ${newEmailsFound} new email(s).` : "Inbox is up to date." };

    } catch (error: any) {
        console.error("[fetchAndStoreEmailsAction Error]", error);
        // Provide a more user-friendly error message
        const errorMessage = error.status === 401 
            ? "Mailgun authentication failed. Check API key." 
            : error.message || 'An unknown error occurred while fetching emails.';
        return { success: false, error: errorMessage };
    }
}
    