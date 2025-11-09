'use server';

import { getFirestore, doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';

import formData from 'form-data';
import Mailgun from 'mailgun.js';
import DOMPurify from 'isomorphic-dompurify';

async function getMailgunSettings(firestore: any) {
    const settingsRef = doc(firestore, "admin_settings", "mailgun");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
        throw new Error("Mailgun integration settings not found. Please configure them in the admin panel.");
    }

    const settings = settingsSnap.data();
    
    if (!settings.apiKey || !settings.domain) {
        throw new Error("Mailgun settings are incomplete. Please check the admin panel.");
    }
    
    return {
        apiKey: settings.apiKey,
        domain: settings.domain,
    };
}

export async function fetchEmailsFromServerAction(
    userId: string,
    inboxId: string,
    emailAddress: string
) {
    if (!userId || !inboxId || !emailAddress) {
        return { error: 'Invalid arguments provided.' };
    }

    try {
        const { firestore } = initializeFirebase();
        const { apiKey, domain } = await getMailgunSettings(firestore);

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        const events = await mg.events.get(domain, {
            "to": emailAddress,
            "event": "stored",
            "limit": 30
        });

        if (!events?.items?.length) {
            revalidatePath('/dashboard');
            return { success: true, message: "No new emails found.", emailsAdded: 0 };
        }

        let emailCount = 0;

        for (const event of events.items) {
            const email = event.message;
            if (!email || !email.headers) continue;
            
            const cleanHtml = DOMPurify.sanitize(email['body-html'] || "");

            // Write to the global temp_emails collection
            const tempEmailsRef = collection(firestore, "temp_emails");
            await addDoc(tempEmailsRef, {
                // Not using batch to ensure each mail is processed.
                recipient: emailAddress, // The address it was sent to
                finalUserId: userId,      // The intended final owner
                finalInboxId: inboxId,    // The intended final inbox
                senderName: email.headers.from || "Unknown Sender",
                subject: email.headers.subject || "No Subject",
                receivedAt: new Date(event.timestamp * 1000).toISOString(),
                htmlContent: cleanHtml,
                textContent: email["stripped-text"] || "",
                read: false,
            });
            emailCount++;
        }
        
        revalidatePath('/dashboard');
        
        return { success: true, emailsAdded: emailCount };

    } catch (error: any) {
        console.error("Error in fetchEmailsFromServerAction:", error);
        return { error: error.message || 'An unexpected error occurred while fetching emails.' };
    }
}
