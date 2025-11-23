
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

export const inboundWebhook = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {
        "recipient": to,
        "from": from,
        "subject": subject,
        "body-plain": textContent,
        "body-html": htmlContent,
      } = req.body;

      // 1. Authenticate the request
      const settingsDoc = await db.doc("admin_settings/inbound-new").get();
      if (!settingsDoc.exists) {
        throw new Error("inbound.new settings not found.");
      }
      const { apiKey, headerName } = settingsDoc.data()!;
      
      const requestSecret = req.get(headerName || 'x-inbound-secret');

      if (!apiKey || !requestSecret || requestSecret !== apiKey) {
        functions.logger.warn("Unauthorized webhook access attempt.");
        res.status(401).send("Unauthorized");
        return;
      }

      // 2. Find the target inbox
      const inboxQuery = db.collection("inboxes").where("emailAddress", "==", to);
      const inboxSnapshot = await inboxQuery.get();

      if (inboxSnapshot.empty) {
        functions.logger.log(`No inbox found for email: ${to}. Email will be dropped.`);
        res.status(200).send("OK: No active inbox found, email dropped as intended.");
        return;
      }
      
      const inboxDoc = inboxSnapshot.docs[0];
      const inboxData = inboxDoc.data();
      
      // 3. Create the email document
      const newEmail = {
        inboxId: inboxDoc.id,
        userId: inboxData.userId,
        senderName: from,
        subject: subject,
        receivedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        htmlContent: htmlContent || "",
        textContent: textContent || "",
        rawContent: JSON.stringify(req.body),
        read: false,
        attachments: [],
      };

      await db.collection(`inboxes/${inboxDoc.id}/emails`).add(newEmail);
      
      // 4. Increment email count on the inbox
      await inboxDoc.ref.update({
        emailCount: admin.firestore.FieldValue.increment(1)
      });
      
      functions.logger.info(`Successfully processed email for ${to}`);
      res.status(200).send("Email processed successfully");
      
    } catch (error) {
      functions.logger.error("Error in inboundWebhook:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
