
'use server';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser, ParsedMail } from 'mailparser';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

async function getInboundProviderSettings() {
    const adminFirestore = getAdminFirestore();
    const settingsDoc = await adminFirestore.doc('admin_settings/inbound-new').get();
    
    if (settingsDoc.exists && settingsDoc.data()?.enabled) {
        return settingsDoc.data();
    }
    
    console.warn(`Webhook Error: 'inbound-new' provider is not enabled or configured.`);
    return null;
}

/**
 * Extracts the recipient email address from a parsed email object by checking various headers.
 * @param parsedEmail The ParsedMail object from mailparser.
 * @returns The recipient email address or null if not found.
 */
function getRecipientFromParsedMail(parsedEmail: ParsedMail): string | null {
    // 1. Try 'delivered-to' header first - most reliable
    const deliveredToHeader = parsedEmail.headerLines?.find(h => h.key.toLowerCase() === 'delivered-to');
    if (deliveredToHeader && typeof deliveredToHeader.line === 'string') {
        const emailMatch = deliveredToHeader.line.match(/<(.+?)>/);
        if (emailMatch && emailMatch[1]) {
            return emailMatch[1];
        }
    }

    // 2. Fallback to the 'to' object address
    if (parsedEmail.to) {
        const toValue = Array.isArray(parsedEmail.to) ? parsedEmail.to[0] : parsedEmail.to;
        if (toValue && toValue.address) {
            return toValue.address;
        }
    }
    
    // 3. Fallback for when 'to' is an array of objects
    if (Array.isArray(parsedEmail.to?.value)) {
        const recipient = parsedEmail.to.value.find(v => v.address);
        if (recipient && recipient.address) {
            return recipient.address;
        }
    }

    // 4. Check 'x-original-to' as another common header
    const xOriginalToHeader = parsedEmail.headerLines?.find(h => h.key.toLowerCase() === 'x-original-to');
    if (xOriginalToHeader && typeof xOriginalToHeader.line === 'string') {
         const emailMatch = xOriginalToHeader.line.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/);
         if (emailMatch && emailMatch[0]) {
            return emailMatch[0];
         }
    }

    console.warn("Could not find a valid recipient address in any of the standard headers ('delivered-to', 'to', 'x-original-to').");
    return null;
}


export async function POST(request: Request) {
  try {
    const providerConfig = await getInboundProviderSettings();
    if (!providerConfig) {
      return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }
    
    const headersList = headers();
    const secret = providerConfig.secret; 
    const headerName = providerConfig.headerName;

    if (!secret || !headerName) {
        console.error(`CRITICAL: Webhook security not configured. Missing secret or headerName.`);
        return NextResponse.json({ message: "Configuration error: Webhook security not set." }, { status: 500 });
    }
    
    const requestSecret = headersList.get(headerName);
    
    if (requestSecret !== secret) {
        console.warn(`Unauthorized webhook access attempt. Invalid secret received for header '${headerName}'.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const firestore = getAdminFirestore();

    let toAddress: string | null = null;
    let fromAddress: string | undefined = "Unknown Sender";
    let subject: string | undefined = "No Subject";
    let htmlContent: string | false | undefined = '';
    let textContent: string | undefined = '';
    let rawContent: string = '';
    let messageId: string | undefined;
    let attachments: any[] = [];
    let receivedAt: Date | undefined;


    const contentType = headersList.get('Content-Type');

    if (contentType && contentType.includes('application/json')) {
        const body = await request.json();
        console.log('FULL_WEBHOOK_BODY', JSON.stringify(body, null, 2));

        // Use a robust extraction function for the recipient
        const extractRecipient = (body: any): string | null => {
            return (
                body.to ||
                body.To ||
                body.recipient ||
                body.Recipient ||
                (body.envelope && (body.envelope.to || body.envelope.To)) ||
                body['recipient'] ||
                (body.envelope && body.envelope['to']) ||
                null
            );
        }
        
        toAddress = extractRecipient(body);
        fromAddress = body.From;
        subject = body.Subject;
        htmlContent = body.HtmlBody;
        textContent = body.TextBody;
        messageId = body.MessageID;
        rawContent = JSON.stringify(body);
        receivedAt = body.Date ? new Date(body.Date) : new Date();

    } else {
        rawContent = await request.text();
        const parsedEmail = await simpleParser(rawContent);
        console.log('FULL_PARSED_EMAIL', JSON.stringify(parsedEmail, null, 2));
        
        toAddress = getRecipientFromParsedMail(parsedEmail);
        fromAddress = parsedEmail.from?.text;
        subject = parsedEmail.subject;
        htmlContent = parsedEmail.html;
        textContent = parsed.text;
        messageId = parsedEmail.messageId;
        attachments = parsedEmail.attachments;
        receivedAt = parsedEmail.date;
    }
    
    if (!toAddress) {
      console.error('NO_RECIPIENT_IN_PAYLOAD', rawContent);
      return NextResponse.json({ message: "Bad Request: Recipient address could not be determined." }, { status: 400 });
    }
    
    const inboxQuery = firestore.collection("inboxes").where("emailAddress", "==", toAddress).limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`OK: No active inbox for ${toAddress}. Email dropped as per design.`);
      return NextResponse.json({ message: "OK: No active inbox found for this address." }, { status: 200 });
    }

    const inboxDoc = inboxSnapshot.docs[0];
    const inboxData = inboxDoc.data();

    const newEmail = {
      inboxId: inboxDoc.id,
      userId: inboxData.userId,
      senderName: fromAddress || "Unknown Sender",
      subject: subject || "No Subject",
      receivedAt: receivedAt ? Timestamp.fromDate(new Date(receivedAt)) : Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent: htmlContent || '',
      textContent: textContent || '',
      rawContent: rawContent,
      read: false,
      attachments: attachments.map(att => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType,
        size: att.size,
        url: '' // URL would be populated if attachments were uploaded to storage
      })),
    };

    await firestore.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
    
    console.log(`Webhook: Email successfully processed and stored for ${toAddress}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
