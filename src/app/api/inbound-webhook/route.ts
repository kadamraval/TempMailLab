
'use server';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Extracts the recipient email address from a webhook payload by checking various common fields.
 * Handles nested structures from services like inbound.new.
 * @param body The parsed JSON body of the webhook request.
 * @returns The recipient email address or null if not found.
 */
function extractRecipient(body: any): string | null {
  // Inbound.new style
  const email = body.email || {};
  const parsed = email.parsedData || {};

  const emailTo = Array.isArray(email.to) ? email.to : null;
  const parsedTo = Array.isArray(parsed.to) ? parsed.to : null;

  // Handle various potential structures for the recipient
  const recipient = (
    // 1) Top-level possibilities from various providers
    body.to ||
    body.To ||
    body.recipient ||
    body.Recipient ||

    // 2) Inbound.new: simple "to" array
    (emailTo && emailTo[0]) ||

    // 3) Inbound.new: nested parsedData object
    (parsedTo && (parsedTo[0]?.address || parsedTo[0])) ||
    
    null
  );

  if (typeof recipient === 'string') {
    return recipient;
  }
  
  if (Array.isArray(recipient) && recipient.length > 0) {
    return recipient[0];
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const adminFirestore = getAdminFirestore();
    const settingsDoc = await adminFirestore.doc('admin_settings/inbound-new').get();
    
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        console.warn("Webhook Error: 'inbound-new' provider is not enabled or configured.");
        return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }

    const providerConfig = settingsDoc.data();
    const headersList = headers();
    const secret = providerConfig.secret;
    const headerName = providerConfig.headerName;

    if (!secret || !headerName) {
        console.error("CRITICAL: Webhook security not configured. Missing secret or headerName.");
        return NextResponse.json({ message: "Configuration error: Webhook security not set." }, { status: 500 });
    }

    const requestSecret = headersList.get(headerName);
    
    if (requestSecret !== secret) {
        console.warn(`Unauthorized webhook access attempt. Invalid secret received for header '${headerName}'.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('FULL_WEBHOOK_BODY', JSON.stringify(body, null, 2));

    const toAddress = extractRecipient(body);
    
    if (!toAddress) {
      console.error('NO_RECIPIENT_IN_PAYLOAD', body);
      return NextResponse.json({ message: "Bad Request: Recipient address could not be determined." }, { status: 400 });
    }
    
    const inboxQuery = adminFirestore.collection("inboxes").where("emailAddress", "==", toAddress).limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`OK: No active inbox for ${toAddress}. Email dropped as per design.`);
      return NextResponse.json({ message: "OK: No active inbox found for this address." }, { status: 200 });
    }

    const inboxDoc = inboxSnapshot.docs[0];
    const inboxData = inboxDoc.data();

    const emailData = body.email?.parsedData || body;

    const newEmail = {
      inboxId: inboxDoc.id,
      userId: inboxData.userId,
      senderName: emailData.from?.name || emailData.from?.address || emailData.From || 'Unknown Sender',
      subject: emailData.subject || emailData.Subject || 'No Subject',
      receivedAt: emailData.date ? Timestamp.fromDate(new Date(emailData.date)) : Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent: emailData.htmlBody || emailData.html || '',
      textContent: emailData.textBody || emailData.text || '',
      rawContent: JSON.stringify(body),
      read: false,
      attachments: (emailData.attachments || []).map((att: any) => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType,
        size: att.size || 0,
        url: '' // URL would be populated if attachments were uploaded to storage
      })),
    };

    await adminFirestore.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
    
    console.log(`Webhook: Email successfully processed and stored for ${toAddress}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
