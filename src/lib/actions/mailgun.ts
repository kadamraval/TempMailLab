'use server';

import { getFirestore, doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';

import formData from 'form-data';
import Mailgun from 'mailgun.js';
import DOMPurify from 'isomorphic-dompurify';

// This is a Server Action. It only runs on the server, never in the browser.

/**
 * Fetches the Mailgun integration settings from a secure Firestore document.
 * These settings are configured by the admin.
 * @param firestore - The Firestore instance.
 * @returns An object containing the Mailgun API key, domain, etc.
 * @throws Throws an error if the settings document does not exist or is incomplete.
 */
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


/**
 * Fetches new emails for a given inbox from Mailgun and saves them to Firestore.
 * This is a Server Action and is safe to call from client components.
 * @param userId - The ID of the current user.
 * @param inboxId - The ID of the inbox to fetch emails for.
 * @param emailAddress - The email address of the inbox.
 */
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

        // 1. Fetch new email events from Mailgun
        const events = await mg.events.get(domain, {
            "to": emailAddress,
            "event": "stored",
            "limit": 30 // Fetch up to 30 recent events
        });

        if (!events?.items?.length) {
            revalidatePath('/dashboard');
            return { success: true, message: "No new emails found." };
        }

        // 2. Prepare to save new emails to Firestore
        const batch = writeBatch(firestore);
        let emailCount = 0;

        for (const event of events.items) {
            // Corrected: The email data is in `event.message`, not `event.storage`
            const email = event.message;
            if (!email || !email.headers) continue;
            
            // NOTE: This is a basic implementation. A production system would need a more robust
            // way to prevent duplicate email entries, perhaps by storing and checking message-ids.
            
            // 3. Sanitize the email body
            const cleanHtml = DOMPurify.sanitize(email['body-html'] || "");

            // 4. Create a reference for the new email document
            const emailRef = doc(collection(firestore, "users", userId, "inboxes", inboxId, "emails"));

            batch.set(emailRef, {
                id: emailRef.id,
                inboxId: inboxId,
                senderName: email.headers.from || "Unknown Sender",
                subject: email.headers.subject || "No Subject",
                receivedAt: new Date(event.timestamp * 1000).toISOString(),
                htmlContent: cleanHtml,
                textContent: email["stripped-text"] || "",
                read: false,
            });
            emailCount++;
        }

        // 5. Save all new emails to the database
        if (emailCount > 0) {
            await batch.commit();
        }
        
        // 6. Revalidate the dashboard path to show new data
        revalidatePath('/dashboard');
        
        return { success: true, emailsAdded: emailCount };

    } catch (error: any) {
        console.error("Error in fetchEmailsFromServerAction:", error);
        return { error: error.message || 'An unexpected error occurred while fetching emails.' };
    }
}
