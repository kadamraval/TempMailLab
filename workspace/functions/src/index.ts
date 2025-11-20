
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";
import type { Email } from "./types";
import busboy from "busboy";
import fetch from "node-fetch";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Verifies the Mailgun webhook signature.
 */
const verifyMailgunSignature = (
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): boolean => {
  const encodedToken = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp.concat(token))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(encodedToken),
    Buffer.from(signature)
  );
};


export const mailgunWebhook = onRequest(
  { region: "us-central1", secrets: ["MAILGUN_API_KEY"], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      logger.warn("Received non-POST request.", { method: req.method });
      res.status(405).send("Method Not Allowed");
      return;
    }

    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    if (!mailgunApiKey) {
      logger.error("MAILGUN_API_KEY secret not configured.");
      res.status(500).send("Internal Server Error: Missing API Key configuration.");
      return;
    }

    try {
      // Use busboy to parse multipart/form-data
      const bb = busboy({ headers: req.headers });
      const fields: Record<string, string> = {};

      const parsingPromise = new Promise<void>((resolve, reject) => {
        bb.on("field", (name, val) => {
          fields[name] = val;
        });

        bb.on("error", (err) => {
          logger.error("Busboy parsing error:", err);
          reject(new Error("Error parsing form data."));
        });

        bb.on("finish", () => {
          logger.info("Busboy finished parsing form data.");
          resolve();
        });

        // Pipe the raw request body into busboy.
        bb.end(req.rawBody);
      });

      await parsingPromise;

      // Now that fields are populated, verify signature
      const { timestamp, token, signature } = fields;
      if (!timestamp || !token || !signature) {
        logger.error("Missing signature components in webhook payload.", { fields });
        res.status(400).send("Bad Request: Missing signature.");
        return;
      }
      
      if (!verifyMailgunSignature(mailgunApiKey, timestamp, token, signature)) {
        logger.error("Invalid Mailgun webhook signature.");
        res.status(401).send("Unauthorized: Invalid signature.");
        return;
      }
      logger.info("Mailgun signature verified successfully.");


      const recipient = fields['recipient'];
      const from = fields['From'] || "Unknown Sender";
      const subject = fields['subject'] || "No Subject";
      const messageId = fields['Message-Id'];
      const storageUrl = fields['message-url'];

      if (!recipient) {
        logger.error("Recipient email not found in payload.");
        res.status(400).send("Bad Request: Recipient email not found.");
        return;
      }
      
      if (!messageId) {
        logger.error("Message-Id not found in payload.");
        res.status(400).send("Bad Request: Message-Id not found.");
        return;
      }
      
      logger.info(`Processing email for: ${recipient}`);

      const inboxesRef = db.collection("inboxes");
      const inboxQuery = inboxesRef.where("emailAddress", "==", recipient).limit(1);
      const inboxSnapshot = await inboxQuery.get();

      if (inboxSnapshot.empty) {
        logger.warn(`No inbox found for recipient: ${recipient}. Dropping message.`);
        res.status(200).send("OK: Inbox not found, message dropped.");
        return;
      }

      const inboxDoc = inboxSnapshot.docs[0];
      const inboxId = inboxDoc.id;
      const inboxData = inboxDoc.data();
      logger.info(`Found matching inbox: ${inboxId} for user ${inboxData.userId}`);

      const emailDocId = messageId.replace(/[<>]/g, "");
      const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
      const emailSnap = await emailRef.get();

      if (emailSnap.exists) {
        logger.info(`Email ${emailDocId} already exists in inbox ${inboxId}. Ignoring.`);
        res.status(200).send("OK: Email already exists.");
        return;
      }
      
      // Fetch full email content from storage URL
      let fetchedEmailData;
      if (storageUrl) {
         logger.info("Fetching full email from storage URL:", storageUrl);
         const response = await fetch(storageUrl, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`
            }
         });
         if (!response.ok) {
            throw new Error(`Failed to fetch email from Mailgun storage: ${response.statusText}`);
         }
         fetchedEmailData = await response.json();
      } else {
         throw new Error("message-url not found in webhook payload.");
      }

      const htmlBody = fetchedEmailData['body-html'] || fetchedEmailData['stripped-html'] || '';
      const cleanHtml = DOMPurify.sanitize(htmlBody);

      const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        userId: inboxData.userId,
        senderName: from,
        subject: subject,
        receivedAt: Timestamp.fromMillis(parseInt(fields.timestamp) * 1000),
        createdAt: Timestamp.now(),
        htmlContent: cleanHtml,
        textContent: fetchedEmailData['stripped-text'] || fetchedEmailData['body-plain'] || "No text content.",
        rawContent: JSON.stringify(fetchedEmailData, null, 2),
        read: false,
      };

      await emailRef.set(emailData);

      logger.info(`Successfully processed and saved email ${emailDocId} to inbox ${inboxId}.`);
      res.status(200).send("Email processed successfully.");
    } catch (error: any) {
      logger.error("Error processing Mailgun webhook:", error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  }
);
