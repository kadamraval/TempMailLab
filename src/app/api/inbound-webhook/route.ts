'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      console.warn("Webhook received with an empty body.");
      return NextResponse.json({ message: "Bad Request: Empty body." }, { status: 400 });
    }

    const to = body.recipient || body.To;
    if (!to) {
      console.warn("Webhook received without a recipient address.");
      return NextResponse.json({ message: "Bad Request: Recipient not found." }, { status: 400 });
    }
    
    const firestore = getAdminFirestore();

    // Security check: Use a secret stored in admin_settings
    const settingsDoc = await firestore.doc("admin_settings/inbound-new").get();
    if (settingsDoc.exists) {
      const { apiKey, headerName } = settingsDoc.data() || {};
      if (apiKey && headerName) {
        const headersList = headers();
        const requestSecret = headersList.get(headerName);
        if (requestSecret !== apiKey) {
          console.warn(`Unauthorized webhook access attempt for ${to}. Invalid secret.`);
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
      } else {
        console.warn("Webhook security settings (apiKey/headerName) not configured in Firestore.");
      }
    } else {
        console.log("Security settings for inbound-new not found, proceeding without validation.");
    }


    const inboxQuery = firestore
      .collection("inboxes")
      .where("emailAddress", "==", to)
      .limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`OK: No active inbox for ${to}. Email dropped.`);
      return NextResponse.json({ message: "OK: No active inbox found." }, { status: 200 });
    }

    const inboxDoc = inboxSnapshot.docs[0];
    const inboxData = inboxDoc.data();

    const newEmail = {
      inboxId: inboxDoc.id,
      userId: inboxData.userId,
      senderName: body.from || body.From || "Unknown Sender",
      subject: body.subject || body.Subject || "No Subject",
      receivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent: body['body-html'] || "",
      textContent: body['body-plain'] || "",
      rawContent: JSON.stringify(body),
      read: false,
      attachments: [],
    };

    await firestore.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
    
    await inboxDoc.ref.update({
      emailCount: FieldValue.increment(1),
    });

    console.log(`Email processed successfully for ${to}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    // Log the incoming request body on error for debugging
    try {
        const rawBody = await new Response(request.body).text();
        console.error("Failing request body:", rawBody);
    } catch (e) {
        console.error("Could not parse failing request body.");
    }
    
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
