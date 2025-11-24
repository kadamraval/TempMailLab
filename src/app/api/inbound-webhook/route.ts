
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser, ParsedMail } from 'mailparser';

async function getInboundProviderSettings() {
  const firestore = getAdminFirestore();
  // The provider is hardcoded for now as we only support inbound.new for this flow.
  const activeProvider = 'inbound-new';

  const providerSettingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
  if (providerSettingsDoc.exists && providerSettingsDoc.data()?.enabled) {
    return { provider: activeProvider, settings: providerSettingsDoc.data() };
  }

  console.warn(`Webhook Error: No enabled inbound email provider found for '${activeProvider}'.`);
  return null;
}

/**
 * Robustly extracts the final recipient email address from a parsed email object.
 * It checks multiple headers in a specific order of precedence.
 * @param parsedEmail The ParsedMail object from mailparser.
 * @returns The recipient's email address as a string, or null if not found.
 */
function getRecipientAddress(parsedEmail: ParsedMail): string | null {
  // For debugging: log the entire parsed email object to inspect its structure.
  console.log("INBOUND_WEBHOOK_PARSED_EMAIL", JSON.stringify(parsedEmail, null, 2));

  // 1. Check 'delivered-to' header first, as it's often the most reliable.
  const deliveredToHeader = parsedEmail.headerLines?.find(h => h.key.toLowerCase() === 'delivered-to');
  if (deliveredToHeader && typeof deliveredToHeader.line === 'string') {
    const emailMatch = deliveredToHeader.line.match(/<(.+?)>/);
    if (emailMatch && emailMatch[1]) {
      return emailMatch[1];
    }
  }

  // 2. Fallback to the 'to' field from the parsed object.
  if (parsedEmail.to) {
    const toValue = Array.isArray(parsedEmail.to) ? parsedEmail.to[0] : parsedEmail.to;
    if (toValue && (toValue as any).address) {
      return (toValue as any).address;
    }
  }

  // 3. Fallback to other headers like 'x-original-to'.
  const xOriginalToHeader = parsedEmail.headerLines?.find(h => h.key.toLowerCase() === 'x-original-to');
  if (xOriginalToHeader && typeof xOriginalToHeader.line === 'string') {
    // This header often just contains the email directly.
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

    const firestore = getAdminFirestore();
    const headersList = await headers();

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
    let fromAddress: string | undefined;
    let subject: string | undefined;
    let htmlContent: string = '';
    let textContent: string | undefined;
    let messageId: string | undefined;
    let attachments: any[] = [];
    let rawBody = '';

    const contentType = headersList.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Handle Postmark JSON payload
      const jsonBody = await request.json();
      console.log("INBOUND_WEBHOOK_JSON_BODY", JSON.stringify(jsonBody, null, 2));

      // Postmark JSON fields
      toAddress = jsonBody.To || jsonBody.OriginalRecipient;
      fromAddress = jsonBody.From;
      subject = jsonBody.Subject;
      htmlContent = jsonBody.HtmlBody || '';
      textContent = jsonBody.TextBody;
      messageId = jsonBody.MessageID;
      rawBody = JSON.stringify(jsonBody); // Store JSON as raw content for debugging

      if (jsonBody.Attachments && Array.isArray(jsonBody.Attachments)) {
        attachments = jsonBody.Attachments.map((att: any) => ({
          filename: att.Name,
          contentType: att.ContentType,
          size: att.ContentLength,
          url: '' // Attachments not stored in this flow
        }));
      }

    } else {
      // Handle raw MIME payload (fallback)
      rawBody = await request.text();
      const parsedEmail = await simpleParser(rawBody);

      toAddress = getRecipientAddress(parsedEmail);
      fromAddress = parsedEmail.from?.text;
      subject = parsedEmail.subject;
      htmlContent = typeof parsedEmail.html === 'string' ? parsedEmail.html : '';
      textContent = parsedEmail.text;
      messageId = parsedEmail.messageId;

      if (parsedEmail.attachments && Array.isArray(parsedEmail.attachments)) {
        attachments = parsedEmail.attachments.map(att => ({
          filename: att.filename || 'attachment',
          contentType: att.contentType,
          size: att.size,
          url: ''
        }));
      }
    }

    if (!toAddress) {
      console.warn("Webhook received but no recipient address could be extracted.");
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
      receivedAt: Timestamp.now(), // Use current time as Postmark doesn't always send a clean date field in top level
      createdAt: Timestamp.now(),
      htmlContent,
      textContent,
      rawContent: rawBody,
      read: false,
      attachments: attachments,
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
