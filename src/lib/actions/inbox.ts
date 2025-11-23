'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { simpleParser } from 'mailparser';

async function getProviderSettings() {
    const firestore = getAdminFirestore();
    const emailSettingsDoc = await firestore.doc('admin_settings/email').get();
    const activeProvider = emailSettingsDoc.exists && emailSettingsDoc.data()?.provider ? emailSettingsDoc.data()?.provider : 'inbound-new';
    
    const settingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        throw new Error(`The '${activeProvider}' email provider is not configured or enabled in your admin settings.`);
    }
    const settings = settingsDoc.data();
    if (!settings?.apiKey) {
        throw new Error(`API key for '${activeProvider}' is missing from settings.`);
    }
    return { provider: activeProvider, settings };
}

async function fetchFromInboundNew(apiKey: string, emailAddress: string): Promise<any[]> {
    const url = `https://api.inbound.new/v1/emails?to=${encodeURIComponent(emailAddress)}`;
    const response = await fetch(url, {
        headers: { 'X-Api-Key': apiKey },
        cache: 'no-store'
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("inbound.new API Error:", response.status, errorBody);
        throw new Error(`Failed to fetch emails from inbound.new. Status: ${response.status}`);
    }
    const data = await response.json();
    return data.emails || [];
}

async function fetchFromMailgun(apiKey: string, domain: string, region: 'US' | 'EU', emailAddress: string): Promise<any[]> {
    // Mailgun's Events API is more complex, this is a simplified example
    // A more robust solution might involve filtering events for 'stored' messages.
    return []; // Placeholder
}

async function saveEmailToFirestore(emailData: any, inboxId: string, userId: string) {
    const firestore = getAdminFirestore();
    const parsedEmail = await simpleParser(emailData.raw);
    const messageId = parsedEmail.messageId || firestore.collection('tmp').doc().id;

    // Use a hash of the message-ID for a more Firestore-friendly document ID
    const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
    
    const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
    const emailDoc = await emailRef.get();

    if (emailDoc.exists) {
        return; // Email already processed, skip
    }

    const newEmail = {
        inboxId,
        userId,
        senderName: parsedEmail.from?.text || "Unknown Sender",
        subject: parsedEmail.subject || "No Subject",
        receivedAt: parsedEmail.date || Timestamp.now(),
        createdAt: Timestamp.now(),
        htmlContent: typeof parsedEmail.html === 'string' ? parsedEmail.html : '',
        textContent: parsedEmail.text,
        rawContent: emailData.raw,
        read: false,
        attachments: parsedEmail.attachments.map(att => ({
            filename: att.filename || 'attachment',
            contentType: att.contentType,
            size: att.size,
            url: '' // Placeholder
        })),
    };

    await emailRef.set(newEmail);
    await firestore.doc(`inboxes/${inboxId}`).update({
        emailCount: FieldValue.increment(1),
    });
}

export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    try {
        const { provider, settings } = await getProviderSettings();
        let fetchedEmails: any[] = [];

        if (provider === 'inbound-new') {
            fetchedEmails = await fetchFromInboundNew(settings.apiKey, emailAddress);
        } else if (provider === 'mailgun') {
            // Note: Mailgun fetching is more complex and might require using their Events API.
            // This is a placeholder for that logic.
            // fetchedEmails = await fetchFromMailgun(settings.apiKey, settings.domain, settings.region, emailAddress);
            return { success: true, message: "Mailgun manual fetch is not fully implemented in this example. Emails will arrive via webhook in production." };
        } else {
            throw new Error(`Unsupported email provider configured for manual fetch: ${provider}`);
        }

        if (fetchedEmails.length > 0) {
            for (const emailData of fetchedEmails) {
                await saveEmailToFirestore(emailData, inboxId, userId);
            }
        }

        return { success: true, message: `Found and processed ${fetchedEmails.length} new email(s).` };

    } catch (error: any) {
        console.error("[fetchAndStoreEmailsAction Error]", error);
        return { success: false, error: error.message || 'An unknown error occurred while fetching emails.' };
    }
}
