"use server";

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

async function getSetting(db: FirebaseFirestore.Firestore, settingId: string): Promise<any> {
    const doc = await db.collection('admin_settings').doc(settingId).get();
    return doc.exists ? doc.data() : null;
}

export async function POST(req: NextRequest) {
    const db = getAdminFirestore();

    try {
        const inboundSettings = await getSetting(db, 'inbound-new');
        
        if (!inboundSettings?.enabled) {
            console.log("Webhook skipped: inbound.new integration is disabled.");
            return NextResponse.json({ message: 'Inbound webhook is not enabled.' }, { status: 403 });
        }

        if (inboundSettings.headerName && inboundSettings.headerValue) {
            const receivedSecret = req.headers.get(inboundSettings.headerName.toLowerCase());
            if (receivedSecret !== inboundSettings.headerValue) {
                console.warn("Webhook unauthorized: Invalid secret.");
                return NextResponse.json({ message: 'Unauthorized: Invalid secret.' }, { status: 401 });
            }
        }

        // The body is JSON from inbound.new, not raw email text.
        const payload = await req.json();
        
        // Extract the parsed data directly from the JSON payload.
        const parsedEmail = payload.email?.parsedData;
        const recipientEmail = payload.email?.recipient;

        if (!parsedEmail || !recipientEmail) {
            console.error("Failed to find parsedData or recipient in inbound.new payload.", payload);
            return NextResponse.json({ message: 'Bad Request: Incomplete JSON payload from webhook.' }, { status: 400 });
        }
        
        const inboxQuery = db.collection('inboxes').where('emailAddress', '==', recipientEmail).limit(1);
        const inboxSnapshot = await inboxQuery.get();

        if (inboxSnapshot.empty) {
            console.log(`Webhook OK: Inbox for ${recipientEmail} does not exist, message discarded.`);
            return NextResponse.json({ message: `OK: Inbox for ${recipientEmail} does not exist, message discarded.` }, { status: 200 });
        }
        
        const inboxDoc = inboxSnapshot.docs[0];
        const inboxData = inboxDoc.data();

        const fromAddress = parsedEmail.from?.addresses?.[0];

        const newEmail: any = {
            inboxId: inboxDoc.id,
            userId: inboxData.userId,
            senderName: fromAddress?.name || fromAddress?.address || 'Unknown Sender',
            subject: parsedEmail.subject || 'No Subject',
            receivedAt: parsedEmail.date ? Timestamp.fromDate(new Date(parsedEmail.date)) : FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            htmlContent: parsedEmail.htmlBody || null,
            textContent: parsedEmail.textBody || null,
            rawContent: parsedEmail.raw, // The raw content is inside the parsedData
            read: false,
        };

        if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
            newEmail.attachments = parsedEmail.attachments.map((att: any) => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
                // The URL for the attachment would need to be handled separately,
                // e.g., by uploading to a storage bucket. For now, we leave it empty.
                url: '', 
            }));
        }

        await db.runTransaction(async (transaction) => {
            const emailRef = inboxDoc.ref.collection('emails').doc();
            transaction.set(emailRef, newEmail);
            // Ensure emailCount exists before incrementing
            const currentCount = inboxData.emailCount || 0;
            transaction.update(inboxDoc.ref, { emailCount: currentCount + 1 });
        });

        console.log(`Email successfully processed for inbox ${inboxDoc.id}`);
        return NextResponse.json({ message: 'Email processed successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('[CRITICAL_WEBHOOK_ERROR]', error);
        return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
