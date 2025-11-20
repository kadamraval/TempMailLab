
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
  const encodedToken = createHmac("sha256", signingKey)
    .update(timestamp.concat(token))
    .digest("hex");

  return encodedToken === signature;
}


export const mailgunWebhook = onRequest(
  {
    region: "us-central1", // Specify region
    secrets: ["MAILGUN_SIGNING_KEY"],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      logger.error("Webhook received with non-POST method:", req.method);
      res.status(405).send("Method Not Allowed");
      return;
    }

    logger.info("Mailgun webhook received.");

    const signingKey = process.env.MAILGUN_SIGNING_KEY;
    if (!signingKey) {
      logger.error("MAILGUN_SIGNING_KEY is not set in environment secrets.");
      res.status(500).send("Internal Server Error: Missing signing key.");
      return;
    }

    const busboy = Busboy({headers: req.headers});
    const fields: Record<string, string> = {};

    busboy.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on("finish", async () => {
      try {
        logger.info("Parsed fields:", {fieldCount: Object.keys(fields).length});

        // Validate the webhook signature
        const {timestamp, token, signature} = fields;
        if (!timestamp || !token || !signature) {
          logger.error("Missing timestamp, token, or signature in webhook.");
          res.status(400).send("Missing signature parameters.");
          return;
        }

        if (!validateMailgunWebhook(signingKey, timestamp, token, signature)) {
          logger.error("Invalid Mailgun webhook signature.");
          res.status(403).send("Invalid signature.");
          return;
        }

        logger.info("Mailgun signature validated successfully.");

        const recipient = fields["recipient"];
        if (!recipient) {
          throw new Error("No recipient found in webhook payload.");
        }

        logger.info(`Processing email for recipient: ${recipient}`);

        const inboxQuery = db.collection("inboxes")
          .where("emailAddress", "==", recipient).limit(1);
        const inboxSnap = await inboxQuery.get();

        if (inboxSnap.empty) {
          // It's common for webhooks to fire for already-deleted inboxes.
          // Log it as info and return 200 OK to prevent Mailgun from retrying.
          logger.info(`No inbox found for email address: ${recipient}. Acknowledging to prevent retries.`);
          res.status(200).send("OK: No inbox found.");
          return;
        }

        const inboxDoc = inboxSnap.docs[0];
        const inboxId = inboxDoc.id;
        const userId = inboxDoc.data().userId;
        logger.info(`Found matching inbox ID: ${inboxId} for user ${userId}`);

        const messageId = fields["Message-Id"];
        if (!messageId) {
          throw new Error("Message-Id is missing from the payload.");
        }
        // Create a Firestore-safe document ID from the message ID
        const emailDocId = messageId.trim()
          .replace(/[<>]/g, "").replace(/[\.\#\$\[\]\/\s@]/g, "_");

        const emailRef = db.doc(`inboxes/${inboxId}/emails/${emailDocId}`);
        const emailDoc = await emailRef.get();

        if (emailDoc.exists) {
          logger.warn(`Email ${emailDocId} already exists in inbox ${inboxId}. Acknowledging to prevent retries.`);
          res.status(200).send("OK: Already processed.");
          return;
        }

        const htmlBody = fields["body-html"] || fields["stripped-html"] || "";
        const cleanHtml = DOMPurify.sanitize(htmlBody,
          {USE_PROFILES: {html: true}});

        const emailData: Omit<Email, "id"> = {
          inboxId: inboxId,
          userId: userId, // Denormalize for security rules
          senderName: fields["from"] || "Unknown Sender",
          subject: fields["subject"] || "No Subject",
          receivedAt: Timestamp.fromMillis(parseInt(timestamp, 10) * 1000),
          createdAt: Timestamp.now(),
          htmlContent: cleanHtml,
          textContent: fields["stripped-text"] ||
                       fields["body-plain"] ||
                       "No text content.",
          rawContent: JSON.stringify(fields, null, 2),
          read: false,
        };

        await emailRef.set(emailData);
        logger.info(`Successfully saved email ${emailDocId} to inbox ${inboxId}`);
        res.status(200).send("OK");
      } catch (error: any) {
        logger.error("Error processing webhook:", {
          message: error.message,
          stack: error.stack,
        });
        res.status(500).send(`Internal Server Error: ${error.message}`);
      }
    });

    req.pipe(busboy);
  }
);

    