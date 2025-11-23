
import { NextResponse, type NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/server-init";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export const revalidate = 0;

/**
 * This API Route acts as a webhook to receive inbound emails.
 * It is designed to be triggered by an email service like Mailgun or a generic provider.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract email fields from the request body.
    const {
      recipient: to,
      from,
      subject,
      "body-plain": textContent,
      "body-html": htmlContent,
    } = body;

    const firestore = getAdminFirestore();

    // --- Step 1: Authenticate the webhook request ---
    const settingsDoc = await firestore.doc("admin_settings/inbound-new").get();
    if (!settingsDoc.exists) {
      console.warn("Webhook security settings (admin_settings/inbound-new) are not configured.");
      // Return 200 to prevent retries for a configuration issue.
      return NextResponse.json({ message: "OK: Settings not configured" }, { status: 200 });
    }

    const { apiKey, headerName } = settingsDoc.data() || {};
    const requestSecret = req.headers.get(headerName || 'x-inbound-secret');

    if (!apiKey || !requestSecret || requestSecret !== apiKey) {
      console.warn("Unauthorized webhook access attempt.", {
        recipient: to,
        from: from,
        ip: req.ip,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Step 2: Find the target inbox in Firestore ---
    const inboxQuery = firestore
      .collection("inboxes")
      .where("emailAddress", "==", to)
      .limit(1);
    const inboxSnapshot = await inboxQuery.get();

    if (inboxSnapshot.empty) {
      console.log(`No active inbox found for recipient: ${to}. Email will be dropped.`);
      // Return 200 OK to the webhook provider so they don't retry.
      return NextResponse.json(
        { message: "OK: No active inbox found, email dropped." },
        { status: 200 }
      );
    }

    const inboxDoc = inboxSnapshot.docs[0];
    const inboxData = inboxDoc.data();

    // --- Step 3: Create the new email document ---
    const newEmail = {
      inboxId: inboxDoc.id,
      userId: inboxData.userId, // Denormalized for security rules.
      senderName: from || "Unknown Sender",
      subject: subject || "No Subject",
      receivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      htmlContent: htmlContent || "",
      textContent: textContent || "",
      rawContent: JSON.stringify(body),
      read: false,
      attachments: [],
    };

    await firestore.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);

    // --- Step 4: Optionally, update the inbox metadata ---
    await inboxDoc.ref.update({
      emailCount: FieldValue.increment(1),
    });

    console.log(`Successfully processed and stored email for ${to}`);
    return NextResponse.json({ message: "Email processed successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    // Return a generic 500 error to the client
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
