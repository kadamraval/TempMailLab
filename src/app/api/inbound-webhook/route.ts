
"use server";

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { simpleParser, ParsedMail } from 'mailparser';

// --- Helper function to securely get settings from Firestore ---
async function getSetting(db: FirebaseFirestore.Firestore, settingId: string): Promise<any> {
    const doc = await db.collection('admin_settings').doc(settingId).get();
    return doc.exists ? doc.data() : null;
}

// --- Helper to find the recipient email address from various possible fields ---
function getRecipientAddress(parsedEmail: ParsedMail): string | null {
    if (parsedEmail.to) {
        if (Array.isArray(parsedEmail.to.value) && parsedEmail.to.value.length > 0) {
            return parsedEmail.to.value[0].address || null;
        }
    }
    
    // Fallback for headers if 'to' field is not structured
    const headers = ['delivered-to', 'x-original-to'];
    for (const header of headers) {
        if (parsedEmail.headers.has(header)) {
             const headerValue = parsedEmail.headers.get(header);
             if (typeof headerValue === 'string') return headerValue;
        }
    }
    return null;
}


// --- Main Webhook Handler ---
export async function POST(req: NextRequest) {
    const db = getAdminFirestore();

    try {
        // 1. Authenticate the request
        const inboundSettings = await getSetting(db, 'inbound-new');
        if (!inboundSettings?.enabled || !inboundSettings.headerValue || !inboundSettings.headerName) {
            return NextResponse.json({ message: 'Inbound webhook is not configured or enabled.' }, { status: 403 });
        }

        const receivedSecret = req.headers.get(inboundSettings.headerName.toLowerCase());
        if (receivedSecret !== inboundSettings.headerValue) {
            return NextResponse.json({ message: 'Unauthorized: Invalid secret.' }, { status: 401 });
        }

        // 2. Parse the incoming email content
        const rawEmail = await req.text();
        const parsedEmail = await simpleParser(rawEmail);

        // 3. Determine the recipient and find the corresponding inbox
        const recipientEmail = getRecipientAddress(parsedEmail);

        if (!recipientEmail) {
            return NextResponse.json({ message: 'Bad Request: Recipient address could not be determined.' }, { status: 400 });
        }

        const inboxQuery = db.collection('inboxes').where('emailAddress', '==', recipientEmail).limit(1);
        const inboxSnapshot = await inboxQuery.get();

        if (inboxSnapshot.empty) {
            // It's possible the inbox was deleted but a message is still in flight. 
            // Return 200 to prevent retries for an inbox that no longer exists.
            return NextResponse.json({ message: `OK: Inbox for ${recipientEmail} does not exist, so message was discarded.` }, { status: 200 });
        }
        
        const inboxDoc = inboxSnapshot.docs[0];
        const inboxData = inboxDoc.data();

        // 4. Construct the email document to be saved
        const newEmail: any = {
            inboxId: inboxDoc.id,
            userId: inboxData.userId, // For security rules
            senderName: parsedEmail.from?.value[0]?.name || parsedEmail.from?.value[0]?.address || 'Unknown Sender',
            subject: parsedEmail.subject || 'No Subject',
            receivedAt: parsedEmail.date ? Timestamp.fromDate(parsedEmail.date) : FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            htmlContent: parsedEmail.html || null,
            textContent: parsedEmail.text || null,
            rawContent: rawEmail,
            read: false,
        };

        // Safely handle attachments
        if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
            newEmail.attachments = parsedEmail.attachments.map(att => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
                // Note: Storing attachments requires a storage solution like GCS.
                // For now, we'll just log metadata. We are not storing the attachment itself.
                url: '', 
            }));
        }


        // 5. Save the new email and update the inbox count in a transaction
        await db.runTransaction(async (transaction) => {
            const emailRef = inboxDoc.ref.collection('emails').doc();
            transaction.set(emailRef, newEmail);
            transaction.update(inboxDoc.ref, { emailCount: FieldValue.increment(1) });
        });

        // 6. Return a success response
        return NextResponse.json({ message: 'Email processed successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('[CRITICAL_WEBHOOK_ERROR]', error);
        return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
