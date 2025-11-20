
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";
import type { Email } from "./types";
import busboy from "busboy";

try {
  initializeApp();
} catch (e) {
  logger.info("Firebase Admin SDK already initialized.");
}
const db = getFirestore();

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

// Use the older exports syntax for maximum compatibility with different Firebase deployment environments.
exports.mailgunWebhook = functions.https.onRequest(async (req, res) => {
    logger.info("--- mailgunWebhook function triggered ---", { method: req.method, headers: req.headers });

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
    
    // Using a promise to handle the async nature of busboy
    await new Promise<void>((resolve, reject) => {
        bb.on('field', (name, val) => {
            logger.info(`Busboy receiving field: ${name}`);
            fields[name] = val;
        });
        
        bb.on('finish', async () => {
            logger.info("DEBUG: Busboy finished parsing. All raw fields received:", { fields: Object.keys(fields) });
            try {
                const { timestamp, token, signature, recipient, storage } = fields;

                logger.info("DEBUG: Extracted fields for verification and processing.", { hasTimestamp: !!timestamp, hasToken: !!token, hasSignature: !!signature, recipient, hasStorage: !!storage });

                if (!timestamp || !token || !signature) {
                    logger.error("CRITICAL: Missing signature components in webhook payload.", { fields });
                    res.status(400).send("Bad Request: Missing signature components.");
                    return resolve();
                }

                if (!verifyMailgunSignature(mailgunSigningKey, timestamp, token, signature)) {
                    logger.error("CRITICAL: Invalid Mailgun webhook signature.");
                    res.status(401).send("Unauthorized: Invalid signature.");
                    return resolve();
                }
                logger.info("Mailgun signature verified successfully.");
                
                if (!recipient) {
                    logger.error("CRITICAL: Recipient not found in payload.", { fields });
                    res.status(400).send("Bad Request: Recipient not found.");
                    return resolve();
                }
                logger.info(`Processing email for recipient: ${recipient}`);

                if (!storage) {
                    logger.warn("No 'storage' field found. This might be an 'accepted' event without a stored message. This is OK, but no email will be processed.", { event: fields.event });
                    res.status(200).send("OK: Event received, but no storage info provided.");
                    return resolve();
                }
                
                logger.info("DEBUG: 'storage' field found, parsing JSON.", { storageValue: storage });
                const storageInfo = JSON.parse(storage);
                logger.info("DEBUG: 'storage' JSON parsed successfully.", { storageInfo });
                
                const messageUrl = Array.isArray(storageInfo.url) ? storageInfo.url[0] : storageInfo.url;
                
                if (!messageUrl) {
                     logger.error("CRITICAL: 'url' not found in parsed storage object.", { storageInfo });
                     res.status(400).send("Bad Request: Message URL not found in storage info.");
                     return resolve();
                }
                logger.info(`DEBUG: Extracted message URL: ${messageUrl}`);


                const inboxesRef = db.collection("inboxes");
                const inboxQuery = inboxesRef.where("emailAddress", "==", recipient).limit(1);
                const inboxSnapshot = await inboxQuery.get();

                if (inboxSnapshot.empty) {
                    logger.warn(`No inbox found for recipient: ${recipient}. Message will be dropped.`);
                    res.status(200).send("OK: Inbox not found, message dropped.");
                    return resolve();
                }

                const inboxDoc = inboxSnapshot.docs[0];
                const inboxId = inboxDoc.id;
                const inboxData = inboxDoc.data();
                logger.info(`Found matching inbox: ${inboxId} for user ${inboxData.userId}`);

                const messageIdHeader = fields['Message-Id'] || fields['message-id'];
                 if (!messageIdHeader) {
                    logger.error("CRITICAL: Message-Id not found in payload headers.", { fields });
                    res.status(400).send("Bad Request: Message-Id not found.");
                    return resolve();
                }
                const emailDocId = messageIdHeader.trim().replace(/[<>]/g, "");

                const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
                
                const emailSnap = await emailRef.get();
                if (emailSnap.exists) {
                    logger.info(`Email ${emailDocId} already exists in inbox ${inboxId}. Ignoring duplicate.`);
                    res.status(200).send("OK: Email already exists.");
                    return resolve();
                }

                logger.info(`Fetching full email content from Mailgun storage URL: ${messageUrl}`);
                const response = await fetch(messageUrl, {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`
                    }
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    logger.error("ERROR: Failed to fetch email from Mailgun storage.", { status: response.status, statusText: response.statusText, body: errorBody });
                    throw new Error(`Failed to fetch email from Mailgun storage. Status: ${response.statusText}`);
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
                logger.info(`--- SUCCESS: Processed and saved email ${emailDocId} to inbox ${inboxId}. ---`);
                res.status(200).send("Email processed successfully.");
                resolve();

            } catch (error: any) {
                logger.error("--- CRITICAL ERROR during webhook processing ---", { errorMessage: error.message, stack: error.stack, fields: Object.keys(fields) });
                res.status(500).send(`Internal Server Error: ${error.message}`);
                reject(error);
            }
        });

        bb.on('error', (err) => {
            logger.error('Busboy parsing error:', err);
            reject(err);
        });

        // End the busboy stream
        if (req.rawBody) {
            bb.end(req.rawBody);
        } else {
            req.pipe(bb);
        }
    });
});
