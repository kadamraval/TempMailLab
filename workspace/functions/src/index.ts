import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";
import type { Email } from "./types";
import busboy from "busboy";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Verifies the Mailgun webhook signature against the raw request body.
 * @param signingKey - The Mailgun signing key from environment variables.
 * @param timestamp - The timestamp from the signature.
 * @param token - The token from the signature.
 * @param signature - The signature to verify.
 * @returns {boolean} - True if the signature is valid, false otherwise.
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
  { region: "us-central1", secrets: ["MAILGUN_API_KEY"] },
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

    const { timestamp, token, signature } = req.body.signature;
    if (!timestamp || !token || !signature) {
      logger.error("Missing signature components in webhook payload.");
      res.status(400).send("Bad Request: Missing signature.");
      return;
    }
    
    // The rawBody is a Buffer. We need to convert it to a string to verify.
    // The signature is calculated on the raw payload, so we must use req.rawBody.
    if (!req.rawBody) {
        logger.error("Raw body not available for signature verification.");
        res.status(500).send("Internal Server Error: Could not verify signature.");
        return;
    }

    if (!verifyMailgunSignature(mailgunApiKey, timestamp, token, signature)) {
        logger.error("Invalid Mailgun webhook signature.");
        res.status(401).send("Unauthorized: Invalid signature.");
        return;
    }
    logger.info("Mailgun signature verified successfully.");


    const bb = busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    const files: Record<string, Buffer> = {};
    
    // Wrap busboy in a promise to wait for it to finish.
    const parsingPromise = new Promise<void>((resolve, reject) => {
        bb.on("field", (name, val) => {
            fields[name] = val;
        });

        bb.on("file", (name, stream) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("end", () => {
                files[name] = Buffer.concat(chunks);
            });
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
        // req.pipe(bb) will not work here with req.rawBody available.
        // We must manually write the buffer to busboy and end it.
        bb.end(req.rawBody);
    });

    try {
      await parsingPromise;
      logger.info("Successfully parsed multipart/form-data.", { fieldCount: Object.keys(fields).length });
      
      const recipient = fields['recipient'];
      const from = fields['From'] || "Unknown Sender";
      const subject = fields['subject'] || "No Subject"; // Corrected from 'Subject' to 'subject' as per Mailgun docs
      const messageId = fields['Message-Id'];

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

      // Use the messageId (with <> brackets removed) as the document ID to ensure idempotency.
      const emailDocId = messageId.replace(/[<>]/g, "");
      const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
      const emailSnap = await emailRef.get();

      if (emailSnap.exists) {
        logger.info(`Email ${emailDocId} already exists in inbox ${inboxId}. Ignoring.`);
        res.status(200).send("OK: Email already exists.");
        return;
      }

      const htmlBody = fields['body-html'] || fields['stripped-html'] || '';
      const cleanHtml = DOMPurify.sanitize(htmlBody);

      const emailData: Omit<Email, "id"> = {
        inboxId: inboxId,
        userId: inboxData.userId,
        senderName: from,
        subject: subject,
        receivedAt: Timestamp.fromMillis(parseInt(fields.timestamp) * 1000), // Use timestamp from fields
        createdAt: Timestamp.now(),
        htmlContent: cleanHtml,
        textContent: fields['stripped-text'] || fields['body-plain'] || "No text content.",
        rawContent: JSON.stringify(fields, null, 2),
        read: false,
      };

      await emailRef.set(emailData);

      logger.info(`Successfully processed and saved email ${emailDocId} to inbox ${inboxId}.`);
      res.status(200).send("Email processed successfully.");
    } catch (error: any) {
      logger.error("Error processing Mailgun webhook after parsing:", error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  }
);
