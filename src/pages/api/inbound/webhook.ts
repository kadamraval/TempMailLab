
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { simpleParser } from 'mailparser';
import type { Email } from '@/types';
import { Buffer }from 'buffer';

// Helper to get raw body from request
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        req.on('data', chunk => {
            chunks.push(chunk);
        });
        req.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        req.on('error', reject);
    });
}

export const config = {
    api: {
        bodyParser: false, // We need the raw body to parse the email
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const firestore = getAdminFirestore();

    try {
        const settingsDoc = await firestore.doc('admin_settings/inbound-new').get();
        const settingsData = settingsDoc.exists ? settingsDoc.data() : null;

        if (!settingsData || !settingsData.apiKey || !settingsData.headerName) {
            console.warn('[inbound.new Webhook] Webhook secret/header not configured. Rejecting request.');
            return res.status(503).json({ error: 'Webhook service not configured.' });
        }
        
        const storedSecret = settingsData.apiKey;
        const headerName = settingsData.headerName;

        const secretHeader = req.headers[headerName];

        if (secretHeader !== storedSecret) {
            console.warn(`[inbound.new Webhook] Invalid or missing '${headerName}' header. Request from IP: ${req.socket.remoteAddress}. Headers: ${JSON.stringify(req.headers)}`);
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const rawEmailBuffer = await getRawBody(req);
        const rawEmail = rawEmailBuffer.toString('utf-8');

        const parsedEmail = await simpleParser(rawEmail);
        
        const toAddress = typeof parsedEmail.to === 'object' && parsedEmail.to?.value[0]?.address;
        if (!toAddress) {
            console.log('[inbound.new Webhook] Could not determine recipient address from parsed email.');
            return res.status(400).json({ error: 'Could not determine recipient address.' });
        }
        
        const inboxesQuery = firestore.collection('inboxes').where('emailAddress', '==', toAddress).limit(1);
        const inboxesSnapshot = await inboxesQuery.get();

        if (inboxesSnapshot.empty) {
            console.log(`[inbound.new Webhook] No active inbox found for ${toAddress}. Ignoring email.`);
            return res.status(200).json({ message: `No active inbox found for ${toAddress}. Ignoring.` });
        }

        const inboxDoc = inboxesSnapshot.docs[0];
        const inboxData = inboxDoc.data();
        const inboxId = inboxDoc.id;
        const userId = inboxData.userId;

        const messageId = parsedEmail.messageId || `no-id-${Date.now()}`;
        const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
        const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
        
        const emailDocSnap = await emailRef.get();
        if (emailDocSnap.exists) {
            console.log(`[inbound.new Webhook] Email with ID ${emailDocId} already exists. Ignoring duplicate.`);
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

        console.log(`[inbound.new Webhook] Successfully processed and stored email for ${toAddress}`);
        return res.status(200).json({ message: 'Email processed successfully.' });

    } catch (error: any) {
        console.error('[inbound.new Webhook Error]', error);
        return res.status(500).json({ error: 'Internal server error processing email.' });
    }
}

