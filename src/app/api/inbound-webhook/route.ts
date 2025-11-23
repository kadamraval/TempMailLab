'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';

async function getInboundProviderSettings() {
    const firestore = getAdminFirestore();
    // Check for inbound.new first
    const inboundNewSettings = await firestore.doc("admin_settings/inbound-new").get();
    if (inboundNewSettings.exists && inboundNewSettings.data()?.enabled) {
        return { provider: 'inbound-new', settings: inboundNewSettings.data() };
    }
    // Fallback to mailgun
    const mailgunSettings = await firestore.doc("admin_settings/mailgun").get();
    if (mailgunSettings.exists && mailgunSettings.data()?.enabled) {
        return { provider: 'mailgun', settings: mailgunSettings.data() };
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
    if (apiKey && headerName) {
      const headersList = headers();
      const requestSecret = headersList.get(headerName);
      if (requestSecret !== apiKey) {
        console.warn(`Unauthorized webhook access attempt. Invalid secret from provider: ${providerConfig.provider}.`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn(`Webhook security settings (apiKey/headerName) not configured for ${providerConfig.provider}.`);
      // Decide if you want to proceed without security. For production, you should return an error.
      return NextResponse.json({ message: "Configuration error: Webhook security not configured." }, { status: 500 });
    }

    // --- Start of Body Parsing ---
    const rawBody = await request.text();
    let body;
    let toAddress: string | undefined;
    let fromAddress: string | undefined;
    let subject: string | undefined;
    let htmlContent: string | undefined = '';
    let textContent: string | undefined = '';

    if (providerConfig.provider === 'mailgun') {
        // Mailgun sends form data, but we can parse it from the raw text
        const parsedEmail = await simpleParser(rawBody);
        toAddress = parsedEmail.to?.text;
        fromAddress = parsedEmail.from?.text;
        subject = parsedEmail.subject;
        htmlContent = typeof parsedEmail.html === 'string' ? parsedEmail.html : '';
        textContent = parsedEmail.text;
    } else { // Default to JSON for inbound.new and others
        body = JSON.parse(rawBody);
        toAddress = body.recipient || body.To;
        fromAddress = body.from || body.From;
        subject = body.subject || body.Subject;
        htmlContent = body['body-html'] || '';
        textContent = body['body-plain'] || '';
    }
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

    const newEmail = {
      inboxId: inboxDoc.id,
      userId: inboxData.userId,
      senderName: fromAddress || "Unknown Sender",
      subject: subject || "No Subject",
      receivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent,
      textContent,
      rawContent: rawBody, // Store the full raw content
      read: false,
      attachments: [], // Attachment parsing can be added here if needed
    };

    await firestore.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
    
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
