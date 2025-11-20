
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";
import type { Email } from "./types";
import busboy from "busboy";

// Initialize Firebase Admin SDK
try {
  initializeApp();
} catch (e) {
  logger.info("Firebase Admin SDK already initialized.");
}
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
  logger.info("Verifying Mailgun signature...", { timestamp, token, signature: signature.substring(0, 10) + "..." });
  try {
    const encodedToken = crypto
      .createHmac("sha256", signingKey)
      .update(timestamp.concat(token))
      .digest("hex");

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(encodedToken),
      Buffer.from(signature)
    );
    logger.info(`Signature verification result: ${signaturesMatch}`);
    return signaturesMatch;
  } catch (error) {
    logger.error("Error during signature verification:", error);
    return false;
  }
};

export const mailgunWebhook = onRequest(
  { region: "us-central1", cors: true, memory: "256MiB" },
  async (req, res) => {
    logger.info("mailgunWebhook function triggered.", { method: req.method });

    if (req.method !== "POST") {
      logger.warn("Received non-POST request.", { method: req.method });
      res.status(405).send("Method Not Allowed");
      return;
    }

    let mailgunSigningKey: string;
    let mailgunApiKey: string;
    try {
      const settingsDoc = await db.doc("admin_settings/mailgun").get();
      const settingsData = settingsDoc.data();

      if (!settingsDoc.exists || !settingsData?.signingKey || !settingsData?.apiKey) {
        throw new Error("Mailgun signingKey or apiKey is not configured in Firestore 'admin_settings/mailgun'.");
      }
      mailgunSigningKey = settingsData.signingKey;
      mailgunApiKey = settingsData.apiKey;
      logger.info("Successfully retrieved Mailgun keys from Firestore.");
    } catch (error: any) {
      logger.error("FATAL: Failed to retrieve Mailgun keys from Firestore.", { errorMessage: error.message });
      res.status(500).send("Internal Server Error: Could not retrieve API keys.");
      return;
    }

    const bb = busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    const files: any[] = [];

    bb.on('field', (name, val) => {
        fields[name] = val;
    });

    bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        let buffer = Buffer.alloc(0);
        file.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);
        });
        file.on('end', () => {
            files.push({
                fieldname: name,
                originalname: filename,
                encoding,
                mimetype: mimeType,
                buffer,
                size: buffer.length,
            });
        });
    });

    bb.on('finish', async () => {
        logger.info("Busboy finished parsing. Processing fields.", { fieldNames: Object.keys(fields) });

        try {
            const { timestamp, token, signature, recipient, 'message-url': messageUrl } = fields;

            if (!timestamp || !token || !signature) {
                logger.error("CRITICAL: Missing signature components in webhook payload.", { fields });
                res.status(400).send("Bad Request: Missing signature components.");
                return;
            }

            if (!verifyMailgunSignature(mailgunSigningKey, timestamp, token, signature)) {
                logger.error("CRITICAL: Invalid Mailgun webhook signature.");
                res.status(401).send("Unauthorized: Invalid signature.");
                return;
            }
            logger.info("Mailgun signature verified successfully.");
            
            if (!recipient) {
                logger.error("CRITICAL: Recipient not found in payload.", { fields });
                res.status(400).send("Bad Request: Recipient not found.");
                return;
            }
            logger.info(`Processing email for recipient: ${recipient}`);

            if (!messageUrl) {
                logger.warn("No 'message-url' found. This might be an 'accepted' event without storage. A 'stored' event should follow.", { event: fields.event });
                res.status(200).send("OK: Event received, no action taken (no message-url).");
                return;
            }

            const inboxesRef = db.collection("inboxes");
            const inboxQuery = inboxesRef.where("emailAddress", "==", recipient).limit(1);
            const inboxSnapshot = await inboxQuery.get();

            if (inboxSnapshot.empty) {
                logger.warn(`No inbox found for recipient: ${recipient}. Message will be dropped.`);
                res.status(200).send("OK: Inbox not found, message dropped.");
                return;
            }

            const inboxDoc = inboxSnapshot.docs[0];
            const inboxId = inboxDoc.id;
            const inboxData = inboxDoc.data();
            logger.info(`Found matching inbox: ${inboxId} for user ${inboxData.userId}`);

            const messageId = fields['Message-Id']?.trim() || fields['message-id']?.trim();
            if (!messageId) {
                logger.error("CRITICAL: Message-Id not found in payload.", { fields });
                res.status(400).send("Bad Request: Message-Id not found.");
                return;
            }
            const emailDocId = messageId.replace(/[<>]/g, "");
            const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
            
            const emailSnap = await emailRef.get();
            if (emailSnap.exists) {
                logger.info(`Email ${emailDocId} already exists in inbox ${inboxId}. Ignoring duplicate.`);
                res.status(200).send("OK: Email already exists.");
                return;
            }

            logger.info(`Fetching full email content from Mailgun storage URL: ${messageUrl}`);
            const response = await fetch(messageUrl, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to fetch email from Mailgun storage. Status: ${response.statusText}, Body: ${errorBody}`);
            }
            
            const fetchedEmailData = await response.json();
            logger.info("Successfully fetched email data from Mailgun.", { keys: Object.keys(fetchedEmailData) });

            const htmlBody = fetchedEmailData['body-html'] || fetchedEmailData['stripped-html'] || '';
            const cleanHtml = DOMPurify.sanitize(htmlBody);

            const emailData: Omit<Email, "id"> = {
                inboxId: inboxId,
                userId: inboxData.userId,
                senderName: fields['from'] || fields['From'] || "Unknown Sender",
                subject: fields['subject'] || fields['Subject'] || "No Subject",
                receivedAt: Timestamp.fromMillis(parseInt(timestamp) * 1000),
                createdAt: Timestamp.now(),
                htmlContent: cleanHtml,
                textContent: fetchedEmailData['stripped-text'] || fetchedEmailData['body-plain'] || "No text content.",
                rawContent: JSON.stringify(fetchedEmailData, null, 2),
                read: false,
                attachments: fetchedEmailData.attachments || []
            };

            await emailRef.set(emailData);
            logger.info(`SUCCESS: Processed and saved email ${emailDocId} to inbox ${inboxId}.`);
            res.status(200).send("Email processed successfully.");
        } catch (error: any) {
            logger.error("CRITICAL ERROR during webhook processing:", { errorMessage: error.message, stack: error.stack, fields });
            res.status(500).send(`Internal Server Error: ${error.message}`);
        }
    });

    req.pipe(bb);
  }
);

    