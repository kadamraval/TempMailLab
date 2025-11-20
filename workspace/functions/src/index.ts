
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Mailgun from "mailgun.js";
import formData from "form-data";
import * as crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";
import type { Email } from "./types";

initializeApp();
const db = getFirestore();

interface MailgunWebhookSignature {
  timestamp: string;
  token: string;
  signature: string;
}

const verifyMailgunWebhook = (
  signingKey: string,
  signature: MailgunWebhookSignature
): boolean => {
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(`${signature.timestamp}${signature.token}`);
  const calculatedSignature = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature, "hex"),
    Buffer.from(signature.signature, "hex")
  );
};

export const mailgunWebhook = onRequest(
  { region: "us-central1", secrets: ["MAILGUN_API_KEY"] },
  async (req, res) => {
    logger.info("Mailgun webhook received.", { body: req.body });

    if (req.method !== "POST") {
      logger.warn("Received non-POST request.", { method: req.method });
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const mailgunApiKey = process.env.MAILGUN_API_KEY;
      if (!mailgunApiKey) {
        throw new Error("MAILGUN_API_KEY secret not configured.");
      }

      // The signature is now at the top level of the body
      const signature = req.body.signature as MailgunWebhookSignature;
      if (!signature || !signature.timestamp || !signature.token || !signature.signature) {
        logger.error("Invalid or missing signature in webhook payload.");
        res.status(400).send("Invalid or missing signature.");
        return;
      }

      if (!verifyMailgunWebhook(mailgunApiKey, signature)) {
        logger.error("Invalid Mailgun webhook signature.");
        res.status(401).send("Invalid signature.");
        return;
      }
      
      // The event data is the entire body, there is no 'event-data' wrapper key
      const eventData = req.body;

      if (eventData.event !== "accepted") {
        logger.info(`Ignoring non-'accepted' event: ${eventData.event}`);
        res.status(200).send("Event ignored.");
        return;
      }
      
      const recipientEmail = eventData.recipient;
      logger.info(`Processing email for: ${recipientEmail}`);

      const inboxesRef = db.collection("inboxes");
      const inboxQuery = inboxesRef.where("emailAddress", "==", recipientEmail).limit(1);
      const inboxSnapshot = await inboxQuery.get();

      if (inboxSnapshot.empty) {
        logger.warn(`No inbox found for recipient: ${recipientEmail}`);
        res.status(404).send("Inbox not found.");
        return;
      }

      const inboxDoc = inboxSnapshot.docs[0];
      const inboxId = inboxDoc.id;
      const inboxData = inboxDoc.data();
      logger.info(`Found inbox ${inboxId} for user ${inboxData.userId}.`);

      // Correctly get message-id from message.headers
      const messageId = eventData.message?.headers?.["message-id"];
      if (!messageId) {
        throw new Error("Message ID not found in webhook payload at message.headers.message-id");
      }

      const emailRef = db.doc(`inboxes/${inboxId}/emails/${messageId}`);
      const emailSnap = await emailRef.get();

      if (emailSnap.exists) {
        logger.info(`Email ${messageId} already exists. Ignoring.`);
        res.status(200).send("Email already exists.");
        return;
      }

      // Correctly handle storage.url as an array
      const storageUrlArray = eventData.storage?.url;
      const storageUrl = Array.isArray(storageUrlArray) ? storageUrlArray[0] : storageUrlArray;

      if (!storageUrl) {
        throw new Error("Storage URL not found in webhook payload.");
      }
      
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({ username: "api", key: mailgunApiKey });
      const messageContent = await mg.messages.get(storageUrl);
      logger.info(`Successfully fetched email content from ${storageUrl}`);

      const cleanHtml = DOMPurify.sanitize(
        messageContent["body-html"] || messageContent["stripped-html"] || ""
      );

      const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        userId: inboxData.userId, // Denormalize userId for security rules
        senderName: messageContent.From || "Unknown Sender",
        subject: messageContent.Subject || "No Subject",
        receivedAt: Timestamp.fromMillis(parseInt(signature.timestamp) * 1000), // Use the signature timestamp
        createdAt: Timestamp.now(),
        htmlContent: cleanHtml,
        textContent: messageContent["stripped-text"] || messageContent["body-plain"] || "No text content.",
        rawContent: JSON.stringify(messageContent, null, 2),
        attachments: messageContent.attachments || [],
        read: false,
      };

      await emailRef.set(emailData);

      logger.info(`Successfully processed and saved email ${messageId} to inbox ${inboxId}.`);
      res.status(200).send("Email processed successfully.");
    } catch (error: any) {
      logger.error("Error processing Mailgun webhook:", error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  }
);
