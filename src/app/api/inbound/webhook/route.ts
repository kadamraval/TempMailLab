
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';
import type { Email } from '@/types';

// This is the new, dedicated webhook endpoint for receiving emails from inbound.new

export async function POST(req: NextRequest) {
    try {
        // The raw email content is sent as the request body
        const rawEmail = await req.text();

        const parsedEmail = await simpleParser(rawEmail);
        
        const toAddress = typeof parsedEmail.to === 'object' && parsedEmail.to?.value[0]?.address;
        if (!toAddress) {
            return NextResponse.json({ error: 'Could not determine recipient address.' }, { status: 400 });
        }
        
        const firestore = getAdminFirestore();

        // Find the inbox that matches the recipient email address
        const inboxesQuery = firestore.collection('inboxes').where('emailAddress', '==', toAddress).limit(1);
        const inboxesSnapshot = await inboxesQuery.get();

        if (inboxesSnapshot.empty) {
            // If no inbox is found, we can't process the email. This is not an error,
            // as we might receive mail for expired or non-existent inboxes.
            return NextResponse.json({ message: `No active inbox found for ${toAddress}. Ignoring.` }, { status: 200 });
        }

        const inboxDoc = inboxesSnapshot.docs[0];
        const inboxData = inboxDoc.data();
        const inboxId = inboxDoc.id;
        const userId = inboxData.userId;

        // Generate a unique ID for the email document based on the message ID
        const messageId = parsedEmail.messageId || `no-id-${Date.now()}`;
        const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
        const emailRef = firestore.doc(`inboxes/${inboxId}/emails/${emailDocId}`);

        // Construct the email data object to be saved in Firestore
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
                url: '' // URL would be handled if we were storing attachments in Cloud Storage
            }))
        };
        
        // Save the new email and update the inbox's email count
        await emailRef.set(emailData);
        await inboxDoc.ref.update({ emailCount: FieldValue.increment(1) });

        // Respond to inbound.new that we have successfully processed the email
        return NextResponse.json({ message: 'Email processed successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('[inbound.new Webhook Error]', error);
        // In case of an unexpected error, report it
        return NextResponse.json({ error: 'Internal server error processing email.' }, { status: 500 });
    }
}
