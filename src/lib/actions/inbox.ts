
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { simpleParser } from 'mailparser';
import { revalidatePath } from 'next/cache';

async function getProviderSettings() {
    const firestore = getAdminFirestore();
    // Since mailgun is removed, we can simplify this to only use inbound-new
    const activeProvider = 'inbound-new';
    
    const settingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        throw new Error(`The '${activeProvider}' email provider is not configured or enabled in your admin settings.`);
    }
    const settings = settingsDoc.data();
    
    if (!settings?.secret) {
        throw new Error(`API secret for '${activeProvider}' is missing. Please add it in Admin > Settings > Integrations > ${activeProvider}.`);
    }
    return { provider: activeProvider, settings };
}

async function fetchFromInboundNew(secret: string, emailAddress: string): Promise<any[]> {
    const url = `https://api.inbound.new/v1/emails?to=${encodeURIComponent(emailAddress)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-Api-Key': secret },
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("inbound.new API Error:", response.status, errorBody);
        throw new Error(`Failed to fetch emails from inbound.new. Status: ${response.status}. Check your API key.`);
    }
    const data = await response.json();
    return data.data || [];
}


async function saveEmailToFirestore(emailData: any, inboxId: string, userId: string) {
    const firestore = getAdminFirestore();
    const parsedEmail = await simpleParser(emailData.raw);
    
    const messageId = parsedEmail.messageId || firestore.collection('tmp').doc().id;
    const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
    
    const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
    const emailDoc = await emailRef.get();

    if (emailDoc.exists) {
        return false; 
    }

    const newEmail = {
        inboxId,
        userId,
        senderName: parsedEmail.from?.text || "Unknown Sender",
        subject: parsedEmail.subject || "No Subject",
        receivedAt: parsedEmail.date ? Timestamp.fromDate(new Date(parsedEmail.date)) : Timestamp.now(),
        createdAt: Timestamp.now(),
        htmlContent: typeof parsedEmail.html === 'string' ? parsedEmail.html : '',
        textContent: parsedEmail.text,
        rawContent: emailData.raw,
        read: false,
        attachments: parsedEmail.attachments.map(att => ({
            filename: att.filename || 'attachment',
            contentType: att.contentType,
            size: att.size,
            url: ''
        })),
    };

    await emailRef.set(newEmail);
    await firestore.doc(`inboxes/${inboxId}`).update({
        emailCount: FieldValue.increment(1),
    });
    return true;
}

export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    try {
        const { provider, settings } = await getProviderSettings();
        let fetchedEmails: any[] = [];
        let newEmailsCount = 0;

        if (provider === 'inbound-new') {
            fetchedEmails = await fetchFromInboundNew(settings.secret, emailAddress);
        } else {
            throw new Error(`Unsupported email provider configured for manual fetch: ${provider}`);
        }

        if (fetchedEmails.length > 0) {
            for (const emailData of fetchedEmails) {
                const wasNew = await saveEmailToFirestore(emailData, inboxId, userId);
                if (wasNew) {
                    newEmailsCount++;
                }
            }
        }
        
        revalidatePath('/', 'layout');

        return { success: true, message: `Found and processed ${newEmailsCount} new email(s).` };

    } catch (error: any) {
        console.error("[fetchAndStoreEmailsAction Error]", error);
        return { success: false, error: error.message || 'An unknown error occurred while fetching emails.' };
    }
}
