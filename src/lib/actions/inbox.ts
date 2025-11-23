
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Email } from '@/types';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { simpleParser } from 'mailparser';
import type { ClientOptions } from 'mailgun.js';
import fetch from 'node-fetch';

const MAILGUN_API_ENDPOINTS = {
    US: 'https://api.mailgun.net',
    EU: 'https://api.eu.mailgun.net'
};

async function getMailgunSettings() {
    const firestore = getAdminFirestore();
    const settingsDoc = await firestore.doc('admin_settings/mailgun').get();
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        throw new Error("Mailgun integration is not configured or enabled in the admin panel.");
    }
    const settings = settingsDoc.data();
    if (!settings?.apiKey || !settings?.domain) {
        throw new Error("Mailgun API key or a default domain is missing from settings.");
    }
    return settings;
}

async function fetchFromMailgun(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    const mailgunSettings = await getMailgunSettings();
    
    const recipientDomain = emailAddress.split('@')[1];
    if (!recipientDomain) {
        return { success: false, error: "Could not determine the domain from the email address." };
    }

    const clientOptions: ClientOptions = {
        username: 'api',
        key: mailgunSettings.apiKey,
        url: mailgunSettings.region === 'EU' ? MAILGUN_API_ENDPOINTS.EU : MAILGUN_API_ENDPOINTS.US,
    };
    
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client(clientOptions);

    const firestore = getAdminFirestore();
    const inboxRef = firestore.doc(`inboxes/${inboxId}`);
    
    const eventsResponse = await mg.events.get(recipientDomain, {
        recipient: emailAddress,
        event: 'stored',
        limit: 25,
    });

    if (eventsResponse.items.length === 0) {
        return { success: true, message: "No new emails found." };
    }
    
    let newEmailsFound = 0;

    for (const event of eventsResponse.items) {
        const messageId = event.message?.headers?.['message-id'];
        if (!messageId) continue;

        const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
        const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
        const emailDoc = await emailRef.get();

        if (emailDoc.exists) continue;
        if (!event.storage || !event.storage.url) continue;

        const rawMessageResponse = await fetch(event.storage.url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`api:${mailgunSettings.apiKey}`).toString('base64')}`
            }
        });

        if (!rawMessageResponse.ok) {
            console.error(`Failed to fetch email from Mailgun storage: ${rawMessageResponse.statusText}`);
            continue; 
        }

        const rawEmailBody = await rawMessageResponse.text();
        const parsedEmail = await simpleParser(rawEmailBody);

        const emailData: Omit<Email, 'id'> = {
            inboxId, userId,
            senderName: parsedEmail.from?.text || "Unknown Sender",
            subject: parsedEmail.subject || "No Subject",
            receivedAt: parsedEmail.date ? Timestamp.fromDate(parsedEmail.date) : Timestamp.fromMillis(event.timestamp * 1000),
            createdAt: Timestamp.now(),
            htmlContent: typeof parsedEmail.html === 'string' ? parsedEmail.html : "",
            textContent: parsedEmail.text || "",
            rawContent: rawEmailBody, read: false,
            attachments: parsedEmail.attachments.map(att => ({
                filename: att.filename || 'attachment', contentType: att.contentType,
                size: att.size, url: ''
            }))
        };
        
        await emailRef.set(emailData);
        newEmailsFound++;
    }
    
    if (newEmailsFound > 0) {
        await inboxRef.update({ emailCount: FieldValue.increment(newEmailsFound) });
    }
    
    return { success: true, message: newEmailsFound > 0 ? `Fetched ${newEmailsFound} new email(s).` : "Inbox is up to date." };
}

async function fetchFromInboundNew(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    return { success: true, message: "inbound.new is configured for real-time webhooks. Manual refresh is not needed." };
}


export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    try {
        const firestore = getAdminFirestore();
        const emailSettingsDoc = await firestore.doc('admin_settings/email').get();
        const activeProvider = emailSettingsDoc.exists ? emailSettingsDoc.data()?.provider : 'mailgun';

        if (activeProvider === 'inbound-new') {
            return await fetchFromInboundNew(emailAddress, inboxId, userId);
        }
        
        return await fetchFromMailgun(emailAddress, inboxId, userId);

    } catch (error: any) {
        console.error("[fetchAndStoreEmailsAction Error]", error);
        let errorMessage = error.message || 'An unknown error occurred while fetching emails.';
        if (error.status === 401) {
             errorMessage = "Mailgun authentication failed. Please check your API key and ensure the correct Region is selected in your settings.";
        }
        return { success: false, error: errorMessage };
    }
}
