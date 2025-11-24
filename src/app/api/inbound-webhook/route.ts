'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser, ParsedMail } from 'mailparser';

async function getInboundProviderSettings() {
    const firestore = getAdminFirestore();
    const emailSettingsDoc = await firestore.doc("admin_settings/email").get();
    const activeProvider = emailSettingsDoc.data()?.provider || 'inbound-new';
    
    const providerSettingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
    if (providerSettingsDoc.exists && providerSettingsDoc.data()?.enabled) {
        return { provider: activeProvider, settings: providerSettingsDoc.data() };
    }
    
    console.warn(`Webhook Error: No enabled inbound email provider found for '${activeProvider}'.`);
    return null;
}

/**
 * Extracts the recipient email address from various possible headers.
 * @param parsedEmail The parsed email object from mailparser.
 * @returns The recipient email address string or null if not found.
 */
function getRecipientAddress(parsedEmail: ParsedMail): string | null {
    if (parsedEmail.to && typeof parsedEmail.to !== 'string' && parsedEmail.to.text) {
        const match = parsedEmail.to.text.match(/<([^>]+)>/);
        if (match && match[1]) return match[1];
        return parsedEmail.to.text;
    }
    
    const headerLines = parsedEmail.headerLines;
    if (headerLines) {
        const headersToTry = ['delivered-to', 'x-original-to', 'to'];
        for (const headerName of headersToTry) {
            const header = headerLines.find(h => h.key.toLowerCase() === headerName);
            if (header && typeof header.line === 'string') {
                 // Extract email from "User <email@example.com>" format
                const match = header.line.match(/<([^>]+)>/);
                if (match && match[1]) {
                    return match[1];
                }
                // Fallback for just email@example.com
                const plainEmail = header.line.split(' ').pop();
                if (plainEmail) return plainEmail;
            }
        }
    }
    
    console.warn("Could not find recipient in 'to' field. Parsed 'to':", JSON.stringify(parsedEmail.to));
    return null;
}


export async function POST(request: Request) {
  try {
    const providerConfig = await getInboundProviderSettings();
    if (!providerConfig) {
      return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }
    
    const firestore = getAdminFirestore();
    const headersList = headers();
    
    // Use the correct field for the webhook secret
    const { webhookSecret, headerName } = providerConfig.settings || {};

    if (!webhookSecret || !headerName) {
        console.error(`CRITICAL: Webhook security not configured for ${providerConfig.provider}. Missing webhookSecret or headerName.`);
        return NextResponse.json({ message: "Configuration error: Webhook security not set." }, { status: 500 });
    }
    
    const requestSecret = headersList.get(headerName);
    
    if (requestSecret !== webhookSecret) {
        console.warn(`Unauthorized webhook access attempt for ${providerConfig.provider}. Invalid secret received for header '${headerName}'.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    const parsedEmail = await simpleParser(rawBody);
    
    const toAddress = getRecipientAddress(parsedEmail);
    
    if (!toAddress) {
      console.warn("Webhook received but no recipient address could be extracted. Headers inspected:", JSON.stringify(parsedEmail.headerLines?.map(h => h.line), null, 2));
      return NextResponse.json({ message: "Bad Request: Recipient address not found." }, { status: 400 });
    }
    
    const fromAddress = parsedEmail.from?.text;
    const subject = parsedEmail.subject;
    const htmlContent = typeof parsedEmail.html === 'string' ? parsedEmail.html : '';
    const textContent = parsedEmail.text;
    const messageId = parsedEmail.messageId;
    
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
      receivedAt: parsedEmail.date ? Timestamp.fromDate(new Date(parsedEmail.date)) : Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent,
      textContent,
      rawContent: rawBody,
      read: false,
      attachments: parsedEmail.attachments.map(att => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType,
        size: att.size,
        url: '' // This would be populated if attachments were stored in Cloud Storage
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
    try {
        // We can't re-read the body of the request here as it has already been consumed.
        // The rawBody variable is available in the outer scope if needed.
    } catch (e) {
        console.error("Could not log failing request body.");
    }
    
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
