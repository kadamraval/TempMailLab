
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";
import type { Email } from "./types";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

interface MailgunWebhookSignature {
  timestamp: string;
  token: string;
  signature: string;
}

/**
 * Verifies the Mailgun webhook signature against the raw request body.
 * This is a critical security step.
 * @param signingKey - The Mailgun signing key from environment variables.
 * @param timestamp - The timestamp from the signature.
 * @param token - The token from the signature.
 * @param signature - The signature to verify.
 * @param rawBody - The raw, unparsed request body.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
const verifyMailgunWebhook = (
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string,
  rawBody: Buffer
): boolean => {
  // Use a constant-time comparison to prevent timing attacks
  try {
    const hmac = crypto.createHmac("sha256", signingKey);
    hmac.update(Buffer.concat([Buffer.from(timestamp), Buffer.from(token)]));
    const calculatedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(calculatedSignature, "utf-8")
    );
  } catch (e) {
    logger.error("Error during signature verification:", e);
    return false;
  }
};


export const mailgunWebhook = onRequest(
  { region: "us-central1", secrets: ["MAILGUN_API_KEY"] },
  async (req, res) => {
    logger.info("Mailgun webhook received.", { headers: req.headers });

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

      // The 'event-data' is now correctly accessed from the parsed body
      const eventData = req.body['event-data'];
      const signature = req.body.signature as MailgunWebhookSignature;
      
      // Critical: Verify the signature against the raw body BEFORE parsing
      // Note: This verification approach is simplified. For multipart/form-data,
      // Mailgun's signature is based on timestamp and token, not the full body.
      const hmac = crypto.createHmac('sha256', mailgunApiKey);
      hmac.update(signature.timestamp + signature.token);
      const calculatedSignature = hmac.digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature.signature))) {
        logger.error("Invalid Mailgun webhook signature.", { received: signature.signature, calculated: calculatedSignature });
        res.status(401).send("Invalid signature.");
        return;
      }

      if (eventData?.event !== "accepted") {
        logger.info(`Ignoring non-'accepted' event: ${eventData?.event}`);
        res.status(200).send("Event ignored.");
        return;
      }
      
      const recipientEmail = eventData.recipient;
      if (!recipientEmail) {
         logger.error("Recipient email not found in payload.");
         res.status(400).send("Recipient email not found.");
         return;
      }
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
      
      // Correctly get the message-id from the nested structure
      const messageId = eventData.message?.headers?.["message-id"];
      if (!messageId) {
        throw new Error("Message ID not found in webhook payload at event-data.message.headers.message-id");
      }

      const emailRef = db.doc(`inboxes/${inboxId}/emails/${messageId}`);
      const emailSnap = await emailRef.get();

      if (emailSnap.exists) {
        logger.info(`Email ${messageId} already exists. Ignoring.`);
        res.status(200).send("Email already exists.");
        return;
      }

      // Correctly get storage URL from the nested structure
      const storageUrl = eventData.storage?.url;
      if (!storageUrl) {
        throw new Error("Storage URL not found in webhook payload.");
      }
      
      // Lazy-load mailgun-js and form-data
      const Mailgun = (await import("mailgun.js")).default;
      const formData = (await import("form-data")).default;

      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({ username: "api", key: mailgunApiKey });

      // Fetch the full email content from the storage URL provided by Mailgun
      const messageContent = await mg.messages.get(storageUrl);
      logger.info(`Successfully fetched email content from ${storageUrl}`);

      const cleanHtml = DOMPurify.sanitize(
        messageContent["body-html"] || messageContent["stripped-html"] || ""
      );

      const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        userId: inboxData.userId,
        senderName: messageContent.From || "Unknown Sender",
        subject: messageContent.Subject || "No Subject",
        // Use the signature timestamp for the received time
        receivedAt: Timestamp.fromMillis(parseInt(signature.timestamp) * 1000),
        createdAt: Timestamp.now(),
        htmlContent: cleanHtml,
        textContent: messageContent["stripped-text"] || messageContent["body-plain"] || "No text content.",
        rawContent: JSON.stringify(messageContent, null, 2), // Storing the full raw object for debugging
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
