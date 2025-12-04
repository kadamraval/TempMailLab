
"use server";

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';

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

        const payload = await req.json();
        const parsedEmail = payload.email?.parsedData;
        const recipientEmail = payload.email?.recipient;

        if (!parsedEmail || !recipientEmail) {
            console.error("Failed to find parsedData or recipient in inbound.new payload.", payload);
            return NextResponse.json({ message: 'Bad Request: Incomplete JSON payload from webhook.' }, { status: 400 });
        }
        
        const inboxQuery = db.collection('inboxes').where('emailAddress', '==', recipientEmail).limit(1);
        const inboxSnapshot = await inboxQuery.get();

        if (inboxSnapshot.empty) {
            console.log(`Webhook OK: Mailbox for ${recipientEmail} does not exist. Message discarded.`);
            return NextResponse.json({ message: `OK: Mailbox does not exist.` }, { status: 200 });
        }
        
        const inboxDoc = inboxSnapshot.docs[0];
        const inboxData = inboxDoc.data();

        // Prevent "Zombie" Emails: Check if email is older than the inbox
        const emailReceivedAt = parsedEmail.date ? Timestamp.fromDate(new Date(parsedEmail.date)) : Timestamp.now();
        if (inboxData.createdAt && emailReceivedAt < inboxData.createdAt) {
            console.log(`Webhook OK: Stale email for ${recipientEmail} received and discarded.`);
            return NextResponse.json({ message: `OK: Stale email discarded.` }, { status: 200 });
        }

        const userRef = db.doc(`users/${inboxData.userId}`);
        const userSnap = await userRef.get();
        const planId = userSnap.exists() ? userSnap.data()?.planId || 'free-default' : 'free-default';

        const planRef = db.doc(`plans/${planId}`);
        const planSnap = await planRef.get();
        
        if (!planSnap.exists()) {
             console.error(`Webhook Abort: Plan '${planId}' not found for user ${inboxData.userId}.`);
             return NextResponse.json({ message: 'Configuration error: Plan not found.' }, { status: 500 });
        }
        const plan = planSnap.data() as Plan;
        
        // Enforce max emails per inbox
        const maxEmails = plan.features.maxEmailsPerInbox ?? 25; // Default to 25 if not set
        if (maxEmails > 0 && (inboxData.emailCount || 0) >= maxEmails) {
             console.log(`Webhook OK: Mailbox ${inboxDoc.id} is full. Message discarded.`);
             return NextResponse.json({ message: `OK: Mailbox full.` }, { status: 200 });
        }

        const fromAddress = parsedEmail.from?.addresses?.[0];

        const newEmail: any = {
            inboxId: inboxDoc.id,
            userId: inboxData.userId,
            senderName: fromAddress?.name || fromAddress?.address || 'Unknown Sender',
            subject: parsedEmail.subject || 'No Subject',
            receivedAt: emailReceivedAt,
            createdAt: FieldValue.serverTimestamp(),
            htmlContent: parsedEmail.htmlBody || null,
            textContent: parsedEmail.textBody || null,
            rawContent: parsedEmail.raw,
            read: false,
        };

        if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
            newEmail.attachments = parsedEmail.attachments.map((att: any) => ({
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

        console.log(`Email successfully processed for inbox ${inboxDoc.id}`);
        return NextResponse.json({ message: 'Email processed successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('[CRITICAL_WEBHOOK_ERROR]', error);
        return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
