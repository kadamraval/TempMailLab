
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import * as crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';
import type { Email } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';
import busboy from 'busboy';

// Helper to verify Mailgun's signature
const verifyMailgunSignature = (signingKey: string, timestamp: string, token: string, signature: string): boolean => {
  try {
    const encodedToken = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp.concat(token))
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(encodedToken), Buffer.from(signature));
  } catch (error) {
    console.error('[MAILGUN_WEBHOOK] Signature verification error:', error);
    return false;
  }
};

// Helper to parse the multipart/form-data
const parseMultipartForm = (req: NextRequest): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
        const fields: Record<string, string> = {};
        const bb = busboy({ headers: { 'content-type': req.headers.get('content-type')! } });

        bb.on('field', (name, val) => {
            fields[name] = val;
        });

        bb.on('finish', () => {
            resolve(fields);
        });

        bb.on('error', (err) => {
            reject(err);
        });
        
        // This is the critical part to handle the ReadableStream from Next.js 13+
        const reader = req.body!.getReader();
        const pump = () => {
            reader.read().then(({ done, value }) => {
                if (done) {
                    bb.end();
                    return;
                }
                bb.write(value);
                pump();
            }).catch(reject);
        };
        pump();
    });
};


export async function POST(req: NextRequest) {
  console.log('[MAILGUN_WEBHOOK] Received a request.');

  try {
    // 1. Get Mailgun keys from Firestore
    const db = getAdminFirestore();
    const settingsDoc = await db.doc('admin_settings/mailgun').get();
    const settingsData = settingsDoc.data();
    const mailgunSigningKey = settingsData?.signingKey;
    const mailgunApiKey = settingsData?.apiKey;

    if (!mailgunSigningKey || !mailgunApiKey) {
      console.error('[MAILGUN_WEBHOOK] Mailgun signing key or API key is not configured in Firestore.');
      return new NextResponse('Internal Server Error: Mailgun keys not configured.', { status: 500 });
    }
    console.log('[MAILGUN_WEBHOOK] Successfully retrieved Mailgun keys from Firestore.');

    // 2. Parse the multipart form data from the request
    const fields = await parseMultipartForm(req);
    console.log('[MAILGUN_WEBHOOK] Parsed form fields:', Object.keys(fields));

    // 3. Verify the signature
    const { timestamp, token, signature, recipient } = fields;
    if (!timestamp || !token || !signature) {
      console.error('[MAILGUN_WEBHOOK] Missing signature components in webhook payload.');
      return new NextResponse('Bad Request: Missing signature components.', { status: 400 });
    }

    if (!verifyMailgunSignature(mailgunSigningKey, timestamp, token, signature)) {
      console.error('[MAILGUN_WEBHOOK] Invalid Mailgun webhook signature.');
      return new NextResponse('Unauthorized: Invalid signature.', { status: 401 });
    }
    console.log('[MAILGUN_WEBHOOK] Signature verified successfully.');

    // 4. Find the corresponding inbox
    if (!recipient) {
      console.error('[MAILGUN_WEBHOOK] Recipient not found in payload.');
      return new NextResponse('Bad Request: Recipient not found.', { status: 400 });
    }
    const inboxQuery = db.collection("inboxes").where("emailAddress", "==", recipient).limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`[MAILGUN_WEBHOOK] No inbox found for recipient: ${recipient}. Message dropped.`);
      return new NextResponse("OK: Inbox not found.", { status: 200 });
    }
    const inboxDoc = inboxSnapshot.docs[0];
    const inboxId = inboxDoc.id;
    const inboxData = inboxDoc.data();
    console.log(`[MAILGUN_WEBHOOK] Found matching inbox: ${inboxId} for user ${inboxData.userId}`);
    
    // 5. Fetch the email content from Mailgun's storage URL
    const storageField = fields['storage'];
    if (!storageField) {
        console.error('[MAILGUN_WEBHOOK] "storage" field not found in webhook payload.');
        return new NextResponse("Bad Request: storage field not found.", { status: 400 });
    }

    const storageInfo = JSON.parse(storageField);
    const storageUrl = storageInfo.url;
    if (!storageUrl) {
      console.error('[MAILGUN_WEBHOOK] "url" not found in storage object.');
      return new NextResponse("Bad Request: url not found in storage object.", { status: 400 });
    }

    console.log(`[MAILGUN_WEBHOOK] Fetching email content from: ${storageUrl}`);
    const response = await fetch(storageUrl, {
      headers: { 'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}` }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[MAILGUN_WEBHOOK] Failed to fetch email from Mailgun storage.', { status: response.status, body: errorBody });
      throw new Error(`Failed to fetch email. Status: ${response.statusText}`);
    }
    const fetchedEmailData = await response.json();
    console.log('[MAILGUN_WEBHOOK] Successfully fetched email data from Mailgun.');

    // 6. Construct and save the email document
    const messageIdHeader = fetchedEmailData?.headers?.['message-id'];
    if (!messageIdHeader) {
      console.error('[MAILGUN_WEBHOOK] Message-Id not found in fetched email data.');
      return new NextResponse('Bad Request: Message-Id not found.', { status: 400 });
    }
    const emailDocId = messageIdHeader.trim().replace(/[<>]/g, "");
    
    const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);

    const htmlBody = fetchedEmailData['body-html'] || fetchedEmailData['stripped-html'] || '';
    const cleanHtml = DOMPurify.sanitize(htmlBody);

    const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        userId: inboxData.userId,
        senderName: fetchedEmailData.from || "Unknown Sender",
        subject: fetchedEmailData.subject || "No Subject",
        receivedAt: Timestamp.fromMillis(parseInt(timestamp) * 1000),
        createdAt: Timestamp.now(),
        htmlContent: cleanHtml,
        textContent: fetchedEmailData['stripped-text'] || fetchedEmailData['body-plain'] || "No text content.",
        rawContent: JSON.stringify(fetchedEmailData, null, 2),
        read: false,
        attachments: fetchedEmailData.attachments || []
    };

    await emailRef.set(emailData);
    console.log(`[MAILGUN_WEBHOOK] SUCCESS: Saved email ${emailDocId} to inbox ${inboxId}.`);
    
    return new NextResponse('Email processed successfully.', { status: 200 });

  } catch (error: any) {
    console.error('[MAILGUN_WEBHOOK_FATAL_ERROR]', {
        message: error.message,
        stack: error.stack,
        name: error.name,
    });
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
