
import { NextResponse, type NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/server-init";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import Cors from 'cors';

export const revalidate = 0;

// Initialize the cors middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  origin: '*',
  allowedHeaders: ['Content-Type', 'x-inbound-secret'],
});

// Helper middleware to run cors
function runMiddleware(
  req: NextRequest,
  res: NextResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

/**
 * Handles OPTIONS preflight requests for CORS.
 */
export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null);
  await runMiddleware(req, res, cors);
  return res;
}


/**
 * This API Route acts as a webhook to receive inbound emails.
 * It is designed to be triggered by an email service like Mailgun or a generic provider.
 */
export async function POST(req: NextRequest) {
  const res = new NextResponse();
  // Run CORS middleware on the request
  await runMiddleware(req, res, cors);

  try {
    // It's crucial to get the admin instance *after* middleware
    const firestore = getAdminFirestore();
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Webhook Error: Could not parse JSON body.", e);
      return NextResponse.json({ error: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    if (!body) {
         return NextResponse.json({ error: "Bad Request: Empty body." }, { status: 400 });
    }

    // Extract email fields from the request body.
    const {
      recipient: to,
      from,
      subject,
      "body-plain": textContent,
      "body-html": htmlContent,
    } = body;

    // --- Step 1: Authenticate the webhook request ---
    const settingsDoc = await firestore.doc("admin_settings/inbound-new").get();
    if (!settingsDoc.exists) {
      console.warn("Webhook security settings (admin_settings/inbound-new) are not configured.");
      return NextResponse.json({ error: "Unauthorized: Webhook not configured" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
