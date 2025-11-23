
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

// Initialize the Firebase Admin SDK.
// This is critical for the function to connect to Firebase services.
admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors({ origin: true });

/**
 * This HTTPS Cloud Function acts as a webhook to receive inbound emails.
 * It is designed to be triggered by an email service like Mailgun or a generic provider.
 */
export const inboundWebhook = functions.https.onRequest(async (req, res) => {
  // Use the cors middleware to handle CORS headers.
  corsHandler(req, res, async () => {
    // We only accept POST requests.
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // Extract email fields from the request body.
      // These field names are common for services like Mailgun.
      const {
        "recipient": to,
        "from": from,
        "subject": subject,
        "body-plain": textContent,
        "body-html": htmlContent,
      } = req.body;

      // --- Step 1: Authenticate the webhook request ---
      // Fetch the secret API key and header name from Firestore.
      // This allows you to configure the webhook security from your admin panel.
      const settingsDoc = await db.doc("admin_settings/inbound-new").get();
      if (!settingsDoc.exists) {
        throw new Error("Webhook security settings (admin_settings/inbound-new) are not configured.");
      }
      const { apiKey, headerName } = settingsDoc.data()!;
      
      // Get the secret from the request header.
      const requestSecret = req.get(headerName || 'x-inbound-secret');

      // If the secrets don't match, deny access.
      if (!apiKey || !requestSecret || requestSecret !== apiKey) {
        functions.logger.warn("Unauthorized webhook access attempt.", {
            recipient: to,
            from: from,
            ip: req.ip
        });
        res.status(401).send("Unauthorized");
        return;
      }

      // --- Step 2: Find the target inbox in Firestore ---
      // Query the 'inboxes' collection to find a document with a matching email address.
      const inboxQuery = db.collection("inboxes").where("emailAddress", "==", to).limit(1);
      const inboxSnapshot = await inboxQuery.get();

      // If no inbox is found, we log it and stop. This is expected behavior for expired addresses.
      if (inboxSnapshot.empty) {
        functions.logger.log(`No active inbox found for recipient: ${to}. Email will be dropped as intended.`);
        res.status(200).send("OK: No active inbox found, email dropped.");
        return;
      }
      
      const inboxDoc = inboxSnapshot.docs[0];
      const inboxData = inboxDoc.data();
      
      // --- Step 3: Create the new email document ---
      const newEmail = {
        inboxId: inboxDoc.id,
        userId: inboxData.userId, // Denormalized for security rules.
        senderName: from || "Unknown Sender",
        subject: subject || "No Subject",
        receivedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        htmlContent: htmlContent || "",
        textContent: textContent || "",
        rawContent: JSON.stringify(req.body), // Store the full raw payload for debugging.
        read: false,
        attachments: [], // Placeholder for future attachment handling.
      };

      // Add the new email to the 'emails' sub-collection of the found inbox.
      await db.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
      
      // --- Step 4: Optionally, update the inbox metadata ---
      // Increment a counter on the inbox document.
      await inboxDoc.ref.update({
        emailCount: admin.firestore.FieldValue.increment(1)
      });
      
      functions.logger.info(`Successfully processed and stored email for ${to}`);
      res.status(200).send("Email processed successfully");
      
    } catch (error) {
      functions.logger.error("Critical error in inboundWebhook:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
