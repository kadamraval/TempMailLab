
'use server';

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Extracts the recipient email address from an inbound.new webhook payload by checking various common fields.
 * Handles the specific nested structures from inbound.new.
 * @param body The parsed JSON body of the webhook request.
 * @returns The recipient email address or null if not found.
 */
function extractRecipient(body: any): string | null {
  // inbound.new specific structure
  const email = body.email || {};
  const parsed = email.parsedData || {};

  const emailTo = Array.isArray(email.to) ? email.to : null;
  const parsedTo = Array.isArray(parsed.to) ? parsed.to : null;

  // 1. Prioritize the parsedData field, which is most reliable.
  const recipientFromParsed = parsedTo && (parsedTo[0]?.address || parsedTo[0]);
  if (typeof recipientFromParsed === 'string') {
    return recipientFromParsed;
  }
  
  // 2. Fallback to the top-level 'to' array in the email object.
  const recipientFromEmail = emailTo && emailTo[0];
  if (typeof recipientFromEmail === 'string') {
      return recipientFromEmail;
  }

  // 3. Check for other common top-level fields as a last resort.
  const recipientFromRoot = body.to || body.To || body.recipient || body.Recipient;
   if (typeof recipientFromRoot === 'string') {
      return recipientFromRoot;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const adminFirestore = getAdminFirestore();
    // Fetch settings for the generic inbound webhook provider
    const settingsDoc = await adminFirestore.doc('admin_settings/inbound-new').get();
    
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        console.warn("Webhook Error: 'inbound-new' provider is not enabled or configured.");
        return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }

    const providerConfig = settingsDoc.data();
    // The secret is stored under the 'secret' field for inbound.new
    const secret = providerConfig.secret; 
    const headerName = providerConfig.headerName;

    if (!secret || !headerName) {
        console.error("CRITICAL: Webhook security not configured. Missing secret or headerName in admin_settings/inbound-new.");
        return NextResponse.json({ message: "Configuration error: Webhook security not set." }, { status: 500 });
    }

    const requestSecret = request.headers.get(headerName);
    
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

    // Use the nested parsedData from inbound.new if it exists, otherwise use top-level fields
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
        // The URL is typically not provided directly; content is usually Base64.
        // For this app, we'll store a placeholder and not handle attachment downloads.
        url: '' 
      })),
    };

    await adminFirestore.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
    
    console.log(`Webhook: Email successfully processed and stored for ${toAddress}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Bad Request: Invalid JSON body." }, { status: 400 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
