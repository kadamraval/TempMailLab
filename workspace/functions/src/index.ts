
import * as functions from "firebase-functions";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { simpleParser } from "mailparser";
import type { Email } from "./types";

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// Specify the region for the function to ensure the URL is predictable.
export const inboundWebhook = functions.region('us-central1').https.onRequest(async (req, res) => {
    // Enable CORS for all origins for the preflight OPTIONS request
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-inbound-secret');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const settingsDoc = await db.doc('admin_settings/inbound-new').get();
        const settingsData = settingsDoc.exists ? settingsDoc.data() : null;

        if (!settingsData || !settingsData.apiKey || !settingsData.headerName) {
            console.warn('[inbound.new Webhook] Webhook secret/header not configured. Rejecting request.');
            return res.status(503).json({ error: 'Webhook service not configured.' });
        }
        
        const storedSecret = settingsData.apiKey;
        const headerName = settingsData.headerName;
        const secretHeader = req.headers[headerName.toLowerCase()]; // Headers are lower-cased

        if (secretHeader !== storedSecret) {
            console.warn(`[inbound.new Webhook] Invalid or missing '${headerName}' header. Request from IP: ${req.ip}.`);
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const rawEmail = req.rawBody.toString('utf-8');
        const parsedEmail = await simpleParser(rawEmail);
        
        const toAddress = typeof parsedEmail.to === 'object' && parsedEmail.to?.value[0]?.address;
        if (!toAddress) {
            console.log('[inbound.new Webhook] Could not determine recipient address.');
            return res.status(400).json({ error: 'Could not determine recipient address.' });
        }
        
        const inboxesQuery = db.collection('inboxes').where('emailAddress', '==', toAddress).limit(1);
        const inboxesSnapshot = await inboxesQuery.get();

        if (inboxesSnapshot.empty) {
            console.log(`[inbound.new Webhook] No active inbox for ${toAddress}.`);
            return res.status(200).json({ message: `No active inbox for ${toAddress}. Ignoring.` });
        }

        const inboxDoc = inboxesSnapshot.docs[0];
        const { userId } = inboxDoc.data();
        const inboxId = inboxDoc.id;

        const messageId = parsedEmail.messageId || `no-id-${Date.now()}`;
        const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
        const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
        
        const emailDocSnap = await emailRef.get();
        if (emailDocSnap.exists) {
            return res.status(200).json({ message: 'Duplicate email ignored.' });
        }

        const emailData: Omit<Email, 'id'> = {
            inboxId,
            userId,
            senderName: parsedEmail.from?.text || "Unknown Sender",
            subject: parsedEmail.subject || "No Subject",
            receivedAt: parsedEmail.date ? Timestamp.fromDate(parsedEmail.date) : Timestamp.now(),
            createdAt: Timestamp.now(),
            htmlContent: typeof parsedEmail.html === 'string' ? parsedEmail.html : "",
            textContent: parsedEmail.text || "",
            rawContent: rawEmail,
            read: false,
            attachments: parsedEmail.attachments.map(att => ({
                filename: att.filename || 'attachment',
                contentType: att.contentType,
                size: att.size,
                url: '' 
            }))
        };
        
        await emailRef.set(emailData);
        await inboxDoc.ref.update({ emailCount: FieldValue.increment(1) });

        console.log(`[inbound.new Webhook] Successfully stored email for ${toAddress}`);
        return res.status(200).json({ message: 'Email processed successfully.' });

    } catch (error: any) {
        console.error('[inbound.new Webhook Error]', error);
        return res.status(500).json({ error: 'Internal server error processing email.' });
    }
});
