
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
        console.warn("Webhook received with an empty body.");
        return res.status(400).send("Bad Request: Empty body.");
      }
      
      const to = body.recipient || body.To;
      if (!to) {
        console.warn("Webhook received without a recipient address.");
        return res.status(400).send("Bad Request: Recipient not found.");
      }

      // Security check: Use a secret stored in admin_settings
      const settingsDoc = await db.doc("admin_settings/inbound-new").get();
      if (settingsDoc.exists) {
        const { apiKey, headerName } = settingsDoc.data() || {};
        if (apiKey && headerName) {
           const requestSecret = req.get(headerName);
           if (requestSecret !== apiKey) {
               console.warn("Unauthorized webhook access attempt.", { recipient: to });
               return res.status(401).send("Unauthorized");
           }
        } else {
             console.warn("Webhook security settings (apiKey/headerName) not configured.");
        }
      }

      const inboxQuery = db
        .collection("inboxes")
        .where("emailAddress", "==", to)
        .limit(1);
      const inboxSnapshot = await inboxQuery.get();

      if (inboxSnapshot.empty) {
        console.log(`OK: No active inbox for ${to}. Email dropped.`);
        return res.status(200).send("OK: No active inbox found for this address.");
      }

      const inboxDoc = inboxSnapshot.docs[0];
      const inboxData = inboxDoc.data();

      const newEmail = {
        inboxId: inboxDoc.id,
        userId: inboxData.userId,
        senderName: body.from || body.From || "Unknown Sender",
        subject: body.subject || body.Subject || "No Subject",
        receivedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        htmlContent: body['body-html'] || "",
        textContent: body['body-plain'] || "",
        rawContent: JSON.stringify(body),
        read: false,
        attachments: [], // Placeholder for attachments feature
      };

      await db.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
      
      await inboxDoc.ref.update({
        emailCount: admin.firestore.FieldValue.increment(1),
      });

      console.log(`Email processed successfully for ${to}`);
      return res.status(200).send("Email processed successfully");

    } catch (error) {
      console.error("Critical error in inboundWebhook function:", error);
      return res.status(500).send("Internal Server Error");
    }
  });
});
