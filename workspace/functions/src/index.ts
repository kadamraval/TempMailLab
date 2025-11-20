
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
  { region: "us-central1", cors: true },
  async (req, res) => {
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
            throw new Error("Mailgun signing key or API key is not configured in Firestore 'admin_settings/mailgun'.");
        }
        mailgunSigningKey = settingsData.signingKey;
        mailgunApiKey = settingsData.apiKey;
        
    } catch (error: any) {
        logger.error("Failed to retrieve Mailgun keys.", { message: error.message });
        res.status(500).send("Internal Server Error: Could not retrieve API keys.");
        return;
    }
    
    // Mailgun can send JSON or form-data. Let's handle both.
    // Check if the content-type is application/json
    if (req.is('application/json')) {
        const payload = req.body;
        const eventData = payload['event-data'];
        
        if (!eventData) {
            logger.error("Invalid JSON payload: 'event-data' is missing.");
            res.status(400).send("Bad Request: Invalid JSON payload.");
            return;
        }

        const { signature, timestamp, token } = eventData.signature;

        if (!timestamp || !token || !signature) {
             logger.error("Missing signature components in webhook payload.", { "payload": eventData });
            res.status(400).send("Bad Request: Missing signature components.");
            return;
        }
        
        if (!verifyMailgunSignature(mailgunSigningKey, timestamp.toString(), token, signature)) {
            logger.error("Invalid Mailgun webhook signature.");
            res.status(401).send("Unauthorized: Invalid signature.");
            return;
        }
        logger.info("Mailgun signature verified successfully.");

        const recipient = eventData.recipient;
        const from = eventData.message.headers.from || "Unknown Sender";
        const subject = eventData.message.headers.subject || "No Subject";
        const messageId = eventData.message.headers["message-id"];
        const messageUrl = eventData.storage?.url;
        
        if (!recipient) {
            logger.error("Recipient not found in payload.");
            res.status(400).send("Bad Request: Recipient not found.");
            return;
        }
        if (!messageId) {
            logger.error("Message-Id not found in payload.");
            res.status(400).send("Bad Request: Message-Id not found.");
            return;
        }
        if (!messageUrl) {
            logger.warn("Message-Url not found in payload for 'accepted' event. This is expected. Waiting for 'stored' event.", { event: eventData.event });
            // For 'accepted' events, it's okay to not have a URL. We just acknowledge it.
            // The 'stored' event will contain the URL to fetch the content.
            res.status(200).send("OK: 'accepted' event received. No action taken.");
            return;
        }

        try {
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

            logger.info("Fetching full email from storage URL:", messageUrl);
            const response = await fetch(messageUrl, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch email from Mailgun storage: ${response.statusText}`);
            }
            const fetchedEmailData = await response.json() as any;

            const htmlBody = fetchedEmailData['body-html'] || fetchedEmailData['stripped-html'] || '';
            const cleanHtml = DOMPurify.sanitize(htmlBody);

            const emailData: Omit<Email, "id"> = {
                inboxId: inboxId,
                userId: inboxData.userId,
                senderName: from,
                subject: subject,
                receivedAt: Timestamp.fromMillis(parseInt(timestamp) * 1000),
                createdAt: Timestamp.now(),
                htmlContent: cleanHtml,
                textContent: fetchedEmailData['stripped-text'] || fetchedEmailData['body-plain'] || "No text content.",
                rawContent: JSON.stringify(fetchedEmailData, null, 2),
                read: false,
                attachments: fetchedEmailData.attachments || []
            };

            await emailRef.set(emailData);

            logger.info(`Successfully processed and saved email ${emailDocId} to inbox ${inboxId}.`);
            res.status(200).send("Email processed successfully.");
        } catch (error: any) {
            logger.error("Error processing Mailgun webhook:", { message: error.message, stack: error.stack });
            res.status(500).send(`Internal Server Error: ${error.message}`);
        }

    } else {
        // Fallback for form-data, though Mailgun webhooks are typically JSON.
        logger.warn("Received non-JSON request. Attempting to parse as form-data.");
         const bb = busboy({ headers: req.headers });
        const fields: Record<string, string> = {};
        
        const parsingPromise = new Promise<void>((resolve, reject) => {
          bb.on("field", (name, val) => {
            fields[name] = val;
          });
          bb.on("finish", () => resolve());
          bb.on("error", (err) => reject(err));
          req.pipe(bb);
        });

        try {
            await parsingPromise;
            // The rest of the logic remains similar but would need to be adapted for form fields
            // For now, we log it, as JSON is the primary expected format.
            logger.info("Parsed form fields:", { fields: Object.keys(fields) });
            res.status(200).send("Form data received but not processed. Please use JSON format.");

        } catch (error: any) {
            logger.error("Error processing form-data webhook:", { message: error.message });
            res.status(500).send(`Internal Server Error: ${error.message}`);
        }
    }
  }
);
