'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';

async function getInboundProviderSettings() {
    const firestore = getAdminFirestore();
    const emailSettingsDoc = await firestore.doc("admin_settings/email").get();
    const activeProvider = emailSettingsDoc.data()?.provider || 'mailgun'; // Default to mailgun
    
    const providerSettingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
    if (providerSettingsDoc.exists && providerSettingsDoc.data()?.enabled) {
        return { provider: activeProvider, settings: providerSettingsDoc.data() };
    }
    
    return null;
}


export async function POST(request: Request) {
  try {
    const providerConfig = await getInboundProviderSettings();
    if (!providerConfig) {
      console.warn("No enabled inbound email provider found in admin_settings.");
      return NextResponse.json({ message: "Configuration error: No email provider enabled." }, { status: 500 });
    }
    
    const firestore = getAdminFirestore();

    // Security Check: Verify the secret from the header
    const { apiKey, headerName } = providerConfig.settings || {};
    if (providerConfig.provider === 'inbound-new' && apiKey && headerName) {
      const headersList = headers();
      const requestSecret = headersList.get(headerName);
      if (requestSecret !== apiKey) {
        console.warn(`Unauthorized webhook access attempt. Invalid secret for inbound-new.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    } else if (providerConfig.provider === 'inbound-new') {
        // Only enforce for inbound-new, as Mailgun has its own signature verification which is more complex
        console.warn(`Webhook security settings (apiKey/headerName) not configured for inbound.new.`);
        return NextResponse.json({ message: "Configuration error: Webhook security not configured." }, { status: 500 });
    }

    // --- Start of Body Parsing ---
    const rawBody = await request.text();
    let toAddress: string | undefined;
    
    const parsedEmail = await simpleParser(rawBody);
    toAddress = parsedEmail.to?.text;
    const fromAddress = parsedEmail.from?.text;
    const subject = parsedEmail.subject;
    const htmlContent = typeof parsedEmail.html === 'string' ? parsedEmail.html : '';
    const textContent = parsedEmail.text;

    // --- End of Body Parsing ---

    if (!toAddress) {
      console.warn("Webhook received without a recipient address.");
      return NextResponse.json({ message: "Bad Request: Recipient not found." }, { status: 400 });
    }
    
    const inboxQuery = firestore
      .collection("inboxes")
      .where("emailAddress", "==", toAddress)
      .limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`OK: No active inbox for ${toAddress}. Email dropped.`);
      return NextResponse.json({ message: "OK: No active inbox found." }, { status: 200 });
    }

    const inboxDoc = inboxSnapshot.docs[0];
    const inboxData = inboxDoc.data();

    // Use Mailgun's message-id for a more reliable unique ID
    const messageId = parsedEmail.messageId;
    const emailDocId = messageId ? messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_") : firestore.collection('tmp').doc().id;


    const newEmail = {
      inboxId: inboxDoc.id,
      userId: inboxData.userId,
      senderName: fromAddress || "Unknown Sender",
      subject: subject || "No Subject",
      receivedAt: parsedEmail.date || Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent,
      textContent,
      rawContent: rawBody, // Store the full raw content
      read: false,
      attachments: parsedEmail.attachments.map(att => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType,
        size: att.size,
        url: '' // URL would need to be populated if you store and serve attachments
      })),
    };

    await firestore.collection(`inboxes/${inboxDoc.id}/emails`).doc(emailDocId).set(newEmail);
    
    await inboxDoc.ref.update({
      emailCount: FieldValue.increment(1),
    });

    console.log(`Email processed successfully for ${toAddress}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    try {
        const rawBodyForError = await new Response(request.body).text();
        console.error("Failing request body:", rawBodyForError);
    } catch (e) {
        console.error("Could not parse failing request body.");
    }
    
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
