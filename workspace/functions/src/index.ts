
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import Busboy from "busboy";
import DOMPurify from "isomorphic-dompurify";
import {Email} from "./types";
import {createHmac} from "crypto";

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Validates the Mailgun webhook signature.
 * @param {string} signingKey - The Mailgun signing key.
 * @param {string} timestamp - The timestamp from the webhook payload.
 * @param {string} token - The token from the webhook payload.
 * @param {string} signature - The signature from the webhook payload.
 * @return {boolean} - True if the signature is valid, false otherwise.
 */
function validateMailgunWebhook(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string,
): boolean {
  logger.info("[1/8] Validating Mailgun webhook signature...");
  const encodedToken = createHmac("sha256", signingKey)
    .update(timestamp.concat(token))
    .digest("hex");

  const isValid = encodedToken === signature;
  if (isValid) {
    logger.info("[1/8] SUCCESS: Mailgun signature is valid.");
  } else {
    logger.error("[1/8] FAILED: Invalid Mailgun signature.", {
      expected: encodedToken,
      received: signature,
    });
  }
  return isValid;
}


export const mailgunWebhook = onRequest(
  {
    region: "us-central1", // Specify region
    secrets: ["MAILGUN_SIGNING_KEY"],
    invoker: "public", // Allow public access for the webhook
    enforceAppCheck: false, // Do not require App Check for this webhook
  },
  async (req, res) => {
    logger.info("Mailgun webhook triggered.");

    if (req.method !== "POST") {
      logger.error("Webhook received with non-POST method:", req.method);
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Retrieve the key from the environment, which is populated by the secret manager.
    const signingKey = process.env.MAILGUN_SIGNING_KEY;
    if (!signingKey) {
      logger.error("CRITICAL: MAILGUN_SIGNING_KEY is not set in environment secrets.");
      res.status(500).send("Internal Server Error: Missing signing key.");
      return;
    }

    const busboy = Busboy({headers: req.headers});
    const fields: Record<string, string> = {};

    busboy.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on("finish", async () => {
      logger.info("[0/8] Parsing multipart form data...");
      try {
        logger.info(`[0/8] SUCCESS: Parsed ${Object.keys(fields).length} fields from Mailgun.`);

        // Step 1: Validate Webhook
        const {timestamp, token, signature} = fields;
        if (!timestamp || !token || !signature) {
          logger.error("[1/8] FAILED: Missing timestamp, token, or signature in webhook.");
          res.status(400).send("Missing signature parameters.");
          return;
        }
        if (!validateMailgunWebhook(signingKey, timestamp, token, signature)) {
          res.status(403).send("Invalid signature.");
          return;
        }

        // Step 2: Find Recipient & Inbox
        logger.info("[2/8] Finding recipient inbox...");
        const recipient = fields["recipient"];
        if (!recipient) {
          logger.error("[2/8] FAILED: No recipient found in webhook payload.");
          res.status(400).send("No recipient found.");
          return;
        }
        logger.info(`[2/8] Recipient found: ${recipient}`);

        const inboxQuery = db.collection("inboxes").where("emailAddress", "==", recipient).limit(1);
        const inboxSnap = await inboxQuery.get();

        if (inboxSnap.empty) {
          logger.warn(`[2/8] No active inbox found for: ${recipient}. This can be normal if the inbox was deleted. Acknowledging to prevent retries.`);
          res.status(200).send("OK: No active inbox found.");
          return;
        }
        const inboxDoc = inboxSnap.docs[0];
        const inboxId = inboxDoc.id;
        const userId = inboxDoc.data().userId;
        logger.info(`[2/8] SUCCESS: Found Inbox ID: ${inboxId} for User ID: ${userId}`);

        // Step 3: Check for Duplicates
        logger.info("[3/8] Checking for duplicate email...");
        const messageId = fields["Message-Id"];
        if (!messageId) {
           logger.error("[3/8] FAILED: Message-Id is missing from the payload.");
           res.status(400).send("Message-Id is missing.");
           return;
        }
        const emailDocId = messageId.trim().replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");
        logger.info(`[3/8] Using document ID: ${emailDocId}`);
        const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
        const emailDoc = await emailRef.get();

        if (emailDoc.exists) {
          logger.warn(`[3/8] FAILED: Email ${emailDocId} already exists in inbox ${inboxId}. Acknowledging to prevent retries.`);
          res.status(200).send("OK: Already processed.");
          return;
        }
        logger.info("[3/8] SUCCESS: Email is not a duplicate.");

        // Step 4: Sanitize HTML
        logger.info("[4/8] Sanitizing HTML content...");
        const htmlBody = fields["body-html"] || fields["stripped-html"] || "";
        const cleanHtml = DOMPurify.sanitize(htmlBody, {USE_PROFILES: {html: true}});
        logger.info("[4/8] SUCCESS: HTML sanitized.");

        // Step 5: Prepare Email Data
        logger.info("[5/8] Preparing email data for Firestore...");
        const emailData: Omit<Email, "id"> = {
          inboxId: inboxId,
          userId: userId,
          senderName: fields["from"] || "Unknown Sender",
          subject: fields["subject"] || "No Subject",
          receivedAt: Timestamp.fromMillis(parseInt(timestamp, 10) * 1000),
          createdAt: Timestamp.now(),
          htmlContent: cleanHtml,
          textContent: fields["stripped-text"] || fields["body-plain"] || "No text content.",
          rawContent: JSON.stringify(fields, null, 2),
          read: false,
        };
        logger.info("[5/8] SUCCESS: Email data prepared.");

        // Step 6: Save to Firestore
        logger.info(`[6/8] Attempting to save email to path: ${emailRef.path}`);
        await emailRef.set(emailData);
        logger.info(`[6/8] SUCCESS: Email ${emailDocId} saved to inbox ${inboxId}.`);
        
        // Step 7: Send response to Mailgun
        logger.info("[7/8] Sending 200 OK response to Mailgun.");
        res.status(200).send("OK");
        logger.info("[8/8] Webhook processing complete.");

      } catch (error: any) {
        logger.error("FATAL: Unhandled error in webhook processing:", {
          message: error.message,
          stack: error.stack,
        });
        res.status(500).send(`Internal Server Error: ${error.message}`);
      }
    });

    req.pipe(busboy);
  }
);
