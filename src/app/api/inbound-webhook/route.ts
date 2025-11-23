
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';

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

export async function POST(request: Request) {
  try {
    const providerConfig = await getInboundProviderSettings();
    if (!providerConfig) {
      return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }
    
    const firestore = getAdminFirestore();

    const headersList = headers();
    const { secret, headerName } = providerConfig.settings || {};
    
    if (!secret || !headerName) {
        console.error(`CRITICAL: Production webhook security not configured for ${providerConfig.provider}. Missing secret or headerName.`);
        return NextResponse.json({ message: "Configuration error: Webhook security not set." }, { status: 500 });
    }
    
    const requestSecret = headersList.get(headerName.toLowerCase());
    if (requestSecret !== secret) {
        console.warn(`Unauthorized webhook access attempt for ${providerConfig.provider}. Invalid secret.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    const parsedEmail = await simpleParser(rawBody);
    
    const toAddress = parsedEmail.to?.text;
    const fromAddress = parsedEmail.from?.text;
    const subject = parsedEmail.subject;
    const htmlContent = typeof parsedEmail.html === 'string' ? parsedEmail.html : '';
    const textContent = parsedEmail.text;
    const messageId = parsedEmail.messageId;

    if (!toAddress) {
      console.warn("Webhook received but no recipient (To:) address found in email.");
      return NextResponse.json({ message: "Bad Request: Recipient address not found." }, { status: 400 });
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
        const rawBodyForError = await new Response(request.body).text();
        console.error("Failing request body:", rawBodyForError.substring(0, 500) + '...');
    } catch (e) {
        console.error("Could not parse failing request body.");
    }
    
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
