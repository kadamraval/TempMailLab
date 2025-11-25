
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser, ParsedMail } from 'mailparser';

async function getInboundProviderSettings() {
    const firestore = getAdminFirestore();
    const emailSettingsDoc = await firestore.doc('admin_settings/email').get();
    const activeProvider = emailSettingsDoc.exists ? emailSettingsDoc.data()?.provider : 'inbound-new';
    
    if (!activeProvider) {
        console.warn(`Webhook Error: No inbound email provider is set in admin_settings/email.`);
        return null;
    }

    const providerSettingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
    if (providerSettingsDoc.exists && providerSettingsDoc.data()?.enabled) {
        return { provider: activeProvider, settings: providerSettingsDoc.data() };
    }
    
    console.warn(`Webhook Error: No enabled inbound email provider found for '${activeProvider}'.`);
    return null;
}

function getRecipientAddress(parsedEmail: ParsedMail): string | null {
    const deliveredToHeader = parsedEmail.headerLines?.find(h => h.key.toLowerCase() === 'delivered-to');
    if (deliveredToHeader && typeof deliveredToHeader.line === 'string') {
        const emailMatch = deliveredToHeader.line.match(/<(.+?)>/);
        if (emailMatch && emailMatch[1]) {
            return emailMatch[1];
        }
    }

    if (parsedEmail.to) {
        const toValue = Array.isArray(parsedEmail.to) ? parsedEmail.to[0] : parsedEmail.to;
        if (toValue && toValue.address) {
            return toValue.address;
        }
    }
    
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
    const firestore = getAdminFirestore();
    const providerConfig = await getInboundProviderSettings();
    if (!providerConfig) {
      return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }
    
    const headersList = headers();
    
    const secret = providerConfig.settings?.secret; 
    const headerName = providerConfig.settings?.headerName;

    if (!secret || !headerName) {
        console.error(`CRITICAL: Webhook security not configured for ${providerConfig.provider}. Missing secret or headerName.`);
        return NextResponse.json({ message: "Configuration error: Webhook security not set." }, { status: 500 });
    }
    
    const requestSecret = headersList.get(headerName);
    
    if (requestSecret !== secret) {
        console.warn(`Unauthorized webhook access attempt for ${providerConfig.provider}. Invalid secret received for header '${headerName}'.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

        toAddress = body.To;
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
        
        toAddress = getRecipientAddress(parsedEmail);
        fromAddress = parsedEmail.from?.text;
        subject = parsedEmail.subject;
        htmlContent = parsedEmail.html;
        textContent = parsedEmail.text;
        messageId = parsedEmail.messageId;
        attachments = parsedEmail.attachments;
        receivedAt = parsedEmail.date;
    }
    
    if (!toAddress) {
      return NextResponse.json({ message: "Bad Request: Recipient address could not be determined." }, { status: 400 });
    }
    
    const inboxQuery = firestore
      .collection("inboxes")
      .where("emailAddress", "==", toAddress)
      .limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`OK: No active inbox for ${toAddress}. Email dropped as per design.`);
      return NextResponse.json({ message: "OK: No active inbox found for this address." }, { status: 200 });
    }

    const inboxDoc = inboxSnapshot.docs[0];
    const inboxData = inboxDoc.data();

    const emailDocId = messageId ? messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_") : firestore.collection('tmp').doc().id;

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
        url: ''
      })),
    };

    await firestore.collection(`inboxes/${inboxDoc.id}/emails`).doc(emailDocId).set(newEmail);
    
    await inboxDoc.ref.update({
      emailCount: FieldValue.increment(1),
    });

    console.log(`Webhook: Email successfully processed and stored for ${toAddress}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
