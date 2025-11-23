
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

      const {
        recipient: to,
        from,
        subject,
        "body-plain": textContent,
        "body-html": htmlContent,
      } = body;

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
        return res.status(200).send("OK: No active inbox found, email dropped.");
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
        attachments: [],
      };

      await db.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
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
