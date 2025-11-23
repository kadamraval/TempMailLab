
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.inboundWebhook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const body = req.body;
      if (!body) {
        return res.status(400).send("Bad Request: Empty body.");
      }

      // Extract email data from Mailgun webhook payload
      const to = body.recipient || body.To;
      const from = body.from || body.From;
      const subject = body.subject || body.Subject;
      const textContent = body['body-plain'] || '';
      const htmlContent = body['body-html'] || '';

      if (!to) {
        console.warn("Webhook received without a recipient address.");
        return res.status(400).send("Bad Request: Recipient not found.");
      }

      const settingsDoc = await db.doc("admin_settings/inbound-new").get();
      if (!settingsDoc.exists) {
        console.warn("Webhook security settings not configured.");
        return res.status(401).send("Unauthorized: Webhook not configured");
      }

      const { apiKey, headerName } = settingsDoc.data() || {};
      const requestSecret = req.get(headerName || "x-inbound-secret");

      if (!apiKey || !requestSecret || requestSecret !== apiKey) {
        console.warn("Unauthorized webhook access attempt.", {
          recipient: to,
          from: from,
        });
        return res.status(401).send("Unauthorized");
      }

      const inboxQuery = db
        .collection("inboxes")
        .where("emailAddress", "==", to)
        .limit(1);
      const inboxSnapshot = await inboxQuery.get();

      if (inboxSnapshot.empty) {
        // It's important to return a 200 OK even if the inbox doesn't exist.
        // This prevents the email provider from retrying and indicates we handled the request.
        return res.status(200).send("OK: No active inbox found for this address, email dropped.");
      }

      const inboxDoc = inboxSnapshot.docs[0];
      const inboxData = inboxDoc.data();

      const newEmail = {
        inboxId: inboxDoc.id,
        userId: inboxData.userId,
        senderName: from || "Unknown Sender",
        subject: subject || "No Subject",
        receivedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        htmlContent: htmlContent || "",
        textContent: textContent || "",
        rawContent: JSON.stringify(body),
        read: false,
        attachments: [], // Placeholder for attachments feature
      };

      await db.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
      
      // Optionally update a counter on the inbox
      await inboxDoc.ref.update({
        emailCount: admin.firestore.FieldValue.increment(1),
      });

      return res.status(200).send("Email processed successfully");
    } catch (error) {
      console.error("Critical error in inboundWebhook function:", error);
      return res.status(500).send("Internal Server Error");
    }
  });
});
