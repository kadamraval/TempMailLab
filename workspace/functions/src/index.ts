
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
  { region: "us-central1" },
  async (req, res) => {
    logger.info("Mailgun webhook received.", { body: req.body });

    if (req.method !== "POST") {
      logger.warn("Received non-POST request.", { method: req.method });
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const settingsSnap = await db.doc("admin_settings/mailgun").get();
      if (!settingsSnap.exists) {
        throw new Error("Mailgun settings not found in Firestore.");
      }
      const { apiKey: mailgunApiKey, domain: mailgunDomain } =
        settingsSnap.data() as { apiKey: string; domain: string };
      if (!mailgunApiKey || !mailgunDomain) {
        throw new Error("Mailgun API key or domain is not configured.");
      }

      const signature = req.body.signature as MailgunWebhookSignature;
      if (!verifyMailgunWebhook(mailgunApiKey, signature)) {
        logger.error("Invalid Mailgun webhook signature.");
        res.status(401).send("Invalid signature.");
        return;
      }

      const eventData = req.body["event-data"];
      if (eventData.event !== "accepted") {
        logger.info(`Ignoring non-accepted event: ${eventData.event}`);
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

      const messageId = eventData.message.headers["message-id"];
      if (!messageId) {
        throw new Error("Message ID not found in webhook payload.");
      }

      const emailRef = db.doc(`inboxes/${inboxId}/emails/${messageId}`);
      const emailSnap = await emailRef.get();

      if (emailSnap.exists) {
        logger.info(`Email ${messageId} already exists. Ignoring.`);
        res.status(200).send("Email already exists.");
        return;
      }

      const storageUrl = eventData.storage?.url;
      if (!storageUrl) {
        throw new Error("Storage URL not found in webhook payload.");
      }
      
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({ username: "api", key: mailgunApiKey });
      const messageContent = await mg.messages.get(storageUrl);

      const cleanHtml = DOMPurify.sanitize(
        messageContent["body-html"] || messageContent["stripped-html"] || ""
      );

      const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        senderName: messageContent.From || "Unknown Sender",
        subject: messageContent.Subject || "No Subject",
        receivedAt: Timestamp.fromMillis(eventData.timestamp * 1000),
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

// This function is kept for cleanup purposes but is no longer part of the primary email receiving flow.
export const fetchEmails = onRequest(
  { region: 'us-central1' },
  (req, res) => {
    logger.info("The 'fetchEmails' function is deprecated and should no longer be called directly.");
    res.status(410).send("This function is deprecated.");
  }
);
