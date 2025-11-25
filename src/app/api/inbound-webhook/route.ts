"use server";

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { simpleParser, ParsedMail } from 'mailparser';

async function getSetting(db: FirebaseFirestore.Firestore, settingId: string): Promise<any> {
    const doc = await db.collection('admin_settings').doc(settingId).get();
    return doc.exists ? doc.data() : null;
}

function getRecipientAddress(parsedEmail: ParsedMail): string | null {
    if (parsedEmail.to) {
        const toField = Array.isArray(parsedEmail.to) ? parsedEmail.to[0] : parsedEmail.to;
        if (toField?.value?.[0]?.address) {
            return toField.value[0].address;
        }
    }
    
    const headers = ['delivered-to', 'x-original-to'];
    for (const header of headers) {
        if (parsedEmail.headers.has(header)) {
             const headerValue = parsedEmail.headers.get(header);
             if (typeof headerValue === 'string') return headerValue;
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    const db = getAdminFirestore();

    try {
        const inboundSettings = await getSetting(db, 'inbound-new');
        
        if (!inboundSettings?.enabled) {
            return NextResponse.json({ message: 'Inbound webhook is not enabled.' }, { status: 403 });
        }

        // Security Check: Only validate if header name and value are configured.
        if (inboundSettings.headerName && inboundSettings.headerValue) {
            const receivedSecret = req.headers.get(inboundSettings.headerName.toLowerCase());
            if (receivedSecret !== inboundSettings.headerValue) {
                return NextResponse.json({ message: 'Unauthorized: Invalid secret.' }, { status: 401 });
            }
        }

        const rawEmail = await req.text();
        const parsedEmail = await simpleParser(rawEmail);

        const recipientEmail = getRecipientAddress(parsedEmail);

        if (!recipientEmail) {
            console.error("Failed to determine recipient from parsed email:", parsedEmail);
            return NextResponse.json({ message: 'Bad Request: Recipient address could not be determined.' }, { status: 400 });
        }

        const inboxQuery = db.collection('inboxes').where('emailAddress', '==', recipientEmail).limit(1);
        const inboxSnapshot = await inboxQuery.get();

        if (inboxSnapshot.empty) {
            return NextResponse.json({ message: `OK: Inbox for ${recipientEmail} does not exist, message discarded.` }, { status: 200 });
        }
        
        const inboxDoc = inboxSnapshot.docs[0];
        const inboxData = inboxDoc.data();

        const newEmail: any = {
            inboxId: inboxDoc.id,
            userId: inboxData.userId,
            senderName: parsedEmail.from?.value[0]?.name || parsedEmail.from?.value[0]?.address || 'Unknown Sender',
            subject: parsedEmail.subject || 'No Subject',
            receivedAt: parsedEmail.date ? Timestamp.fromDate(parsedEmail.date) : FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            htmlContent: parsedEmail.html || null,
            textContent: parsedEmail.text || null,
            rawContent: rawEmail,
            read: false,
        };

        if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
            newEmail.attachments = parsedEmail.attachments.map(att => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
                url: '', 
            }));
        }

        await db.runTransaction(async (transaction) => {
            const emailRef = inboxDoc.ref.collection('emails').doc();
            transaction.set(emailRef, newEmail);
            transaction.update(inboxDoc.ref, { emailCount: FieldValue.increment(1) });
        });

        return NextResponse.json({ message: 'Email processed successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('[CRITICAL_WEBHOOK_ERROR]', error);
        return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
