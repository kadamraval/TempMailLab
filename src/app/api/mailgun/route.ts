
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import * as crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';
import type { Email } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';
import Busboy from 'busboy';

// Helper to verify Mailgun's signature
const verifyMailgunSignature = (signingKey: string, timestamp: string, token: string, signature: string): boolean => {
  try {
    const encodedToken = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp.concat(token))
      .digest('hex');
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(encodedToken, 'hex'), Buffer.from(signature, 'hex'));
  } catch (error) {
    console.error('[MAILGUN_WEBHOOK] Signature verification error:', error);
    return false;
  }
};

// Helper to parse the multipart/form-data from a NextRequest
const parseMultipartForm = (req: NextRequest): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
        const fields: Record<string, string> = {};
        const contentType = req.headers.get('content-type');
        if (!contentType) {
            return reject(new Error("Missing Content-Type header"));
        }

        try {
            const busboy = Busboy({ headers: { 'content-type': contentType } });

            busboy.on('field', (name, val) => {
                fields[name] = val;
            });

            busboy.on('finish', () => {
                console.log('[MAILGUN_WEBHOOK] Busboy finished parsing form fields.');
                resolve(fields);
            });

            busboy.on('error', (err) => {
                console.error('[MAILGUN_WEBHOOK] Busboy parsing error:', err);
                reject(err);
            });
            
            // The Next.js request body is a ReadableStream. We need to handle it properly.
            const reader = req.body!.getReader();
            const stream = new ReadableStream({
                async start(controller) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                            break;
                        }
                        controller.enqueue(value);
                    }
                }
            });

            // The stream needs to be piped to busboy.
            // In Node.js environment this is straightforward with stream.pipe(busboy)
            // In Edge runtime, we might need a workaround if .pipe is not available.
            // For now, assuming a Node.js runtime for App Hosting where this works.
            // @ts-ignore - busboy expects a Node.js stream, but this should work in a Node environment.
            stream.pipe(busboy);


        } catch (err) {
            console.error('[MAILGUN_WEBHOOK] Busboy instantiation error:', err);
            reject(err);
        }
    });
};


export async function POST(req: NextRequest) {
  console.log('[MAILGUN_WEBHOOK] Received a request.');

  try {
    // 1. Get Mailgun keys from Firestore
    const db = getAdminFirestore();
    const settingsDoc = await db.doc('admin_settings/mailgun').get();
    
    if (!settingsDoc.exists) {
        console.error('[MAILGUN_WEBHOOK] Mailgun settings document does not exist in Firestore.');
        return new NextResponse('Internal Server Error: Mailgun not configured.', { status: 500 });
    }
    const settingsData = settingsDoc.data();
    const mailgunSigningKey = settingsData?.signingKey;

    if (!mailgunSigningKey) {
      console.error('[MAILGUN_WEBHOOK] Mailgun signing key is not configured in Firestore.');
      return new NextResponse('Internal Server Error: Mailgun keys not configured.', { status: 500 });
    }
    console.log('[MAILGUN_WEBHOOK] Successfully retrieved Mailgun signing key from Firestore.');

    // 2. Parse the multipart form data from the request
    const fields = await parseMultipartForm(req);
    console.log('[MAILGUN_WEBHOOK] Parsed form fields. Keys found:', Object.keys(fields).length);

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
      // Return 200 OK to prevent Mailgun from retrying.
      return new NextResponse("OK: Inbox not found, message dropped.", { status: 200 });
    }
    const inboxDoc = inboxSnapshot.docs[0];
    const inboxId = inboxDoc.id;
    const inboxData = inboxDoc.data();
    console.log(`[MAILGUN_WEBHOOK] Found matching inbox: ${inboxId} for user ${inboxData.userId}`);
    
    // 5. Construct and save the email document from parsed fields
    const messageIdHeader = fields['Message-Id'];
     if (!messageIdHeader) {
      console.error('[MAILGUN_WEBHOOK] Message-Id not found in webhook payload.');
      // Still return 200 to prevent retries.
      return new NextResponse('OK: Message-Id not found, message dropped.', { status: 200 });
    }
    // Create a Firestore-safe ID from the message-id
    const emailDocId = messageIdHeader.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/]/g, '_');
    
    const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);

    const htmlBody = fields['body-html'] || fields['stripped-html'] || '';
    const cleanHtml = DOMPurify.sanitize(htmlBody);

    const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        userId: inboxData.userId, // Denormalize userId for security rules
        senderName: fields.from || "Unknown Sender",
        subject: fields.subject || "No Subject",
        receivedAt: Timestamp.fromMillis(parseInt(timestamp) * 1000),
        createdAt: Timestamp.now(),
        htmlContent: cleanHtml,
        textContent: fields['stripped-text'] || fields['body-plain'] || "No text content.",
        rawContent: JSON.stringify(fields, null, 2), // Save all fields for debugging
        read: false,
        attachments: [] // Attachments are not handled in this version
    };

    await emailRef.set(emailData);
    console.log(`[MAILGUN_WEBHOOK] SUCCESS: Saved email ${emailDocId} to inbox ${inboxId}.`);
    
    // Crucially, return a 200 OK response to Mailgun to confirm receipt.
    return new NextResponse('Email processed successfully.', { status: 200 });

  } catch (error: any) {
    console.error('[MAILGUN_WEBHOOK_FATAL_ERROR]', {
        message: error.message,
        stack: error.stack,
        name: error.name,
    });
    // On fatal error, still return 500, but log details.
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
