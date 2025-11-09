
'use server';

import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import DOMPurify from 'isomorphic-dompurify';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

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
    sessionId: string,
    emailAddress: string
) {
    if (!sessionId || !emailAddress) {
        return { error: 'Invalid session or email address provided.' };
    }

    const { firestore } = initializeFirebase();
    
    try {
        const { apiKey, domain } = await getMailgunSettings(firestore);

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: apiKey });

        // 1. Fetch new events from Mailgun
        const events = await mg.events.get(domain, {
            "to": emailAddress,
            "event": "stored",
            "limit": 30
        });

        if (events?.items?.length) {
             for (const event of events.items) {
                const email = event.message;
                if (!email || !email.headers) continue;
                
                const cleanHtml = DOMPurify.sanitize(email['body-html'] || "");

                // Write to the global temp_emails collection
                const tempEmailsRef = collection(firestore, "temp_emails");
                await addDoc(tempEmailsRef, {
                    sessionId: sessionId,
                    recipient: emailAddress,
                    senderName: email.headers.from || "Unknown Sender",
                    subject: email.headers.subject || "No Subject",
                    receivedAt: new Date(event.timestamp * 1000).toISOString(),
                    htmlContent: cleanHtml,
                    textContent: email["stripped-text"] || "",
                    read: false,
                });
            }
        }

        // 2. Query for all emails for this session ID
        const tempEmailsQuery = query(collection(firestore, "temp_emails"), where("sessionId", "==", sessionId));
        const querySnapshot = await getDocs(tempEmailsQuery);
        
        if (querySnapshot.empty) {
            return { success: true, emails: [] };
        }

        const emails: any[] = [];
        const batch = writeBatch(firestore);

        querySnapshot.forEach(doc => {
            const data = doc.data();
            emails.push({
                id: doc.id,
                ...data,
            });
            // 3. Delete them after querying
            batch.delete(doc.ref);
        });

        await batch.commit();

        // 4. Return the emails to the client
        return { success: true, emails };

    } catch (error: any) {
        console.error("Error in fetchEmailsFromServerAction:", error);
        return { error: error.message || 'An unexpected error occurred while fetching emails.' };
    }
}
