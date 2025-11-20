
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from 'firebase-functions/v2/https';
import * as functions from "firebase-functions";
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import DOMPurify from 'isomorphic-dompurify';
import type { Email } from './types';


// Initialize Firebase Admin SDK.
try {
  initializeApp();
  logger.info("Firebase Admin SDK initialized successfully.");
} catch (e) {
  logger.error("Error initializing Firebase Admin SDK", e);
}


const firestore = getFirestore();

interface FetchEmailsRequest {
  emailAddress: string;
  inboxId: string;
  ownerToken?: string;
}

const MAILGUN_API_HOSTS = {
  us: 'api.mailgun.net',
  eu: 'api.eu.mailgun.net',
};

async function getMailgunCredentials(log: string[]) {
  try {
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      throw new Error('Mailgun settings document not found in Firestore. Please configure it in the admin panel.');
    }

    const settings = settingsSnap.data();
    if (!settings?.apiKey || !settings.domain) {
      throw new Error('Mailgun API Key or Domain is missing from settings. Please check the configuration.');
    }
    log.push("Successfully retrieved Mailgun credentials.");
    return { apiKey: settings.apiKey, domain: settings.domain };
  } catch (error: any) {
    logger.error('FATAL: Could not get Mailgun credentials.', { errorMessage: error.message });
    log.push(`[FATAL] Could not get Mailgun credentials: ${error.message}`);
    throw error;
  }
}

export const fetchEmails = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { emailAddress, inboxId, ownerToken } = request.data as FetchEmailsRequest;
    const log: string[] = [`[${new Date().toLocaleTimeString()}] Function called for ${emailAddress}.`];

    if (!emailAddress || !inboxId) {
      const errorMsg = 'Function failed: Missing email address or inbox ID.';
      logger.error(errorMsg);
      log.push(errorMsg);
      return { success: false, error: 'Email address and Inbox ID are required.', log };
    }

    try {
      const { apiKey, domain } = await getMailgunCredentials(log);
      const inboxRef = firestore.doc(`inboxes/${inboxId}`);
      const inboxSnap = await inboxRef.get();
      if (!inboxSnap.exists) throw new Error(`Inbox with ID ${inboxId} not found.`);
      
      const userId = inboxSnap.data()?.userId;
      if (!userId) throw new Error(`Could not retrieve user ID for inbox ${inboxId}.`);
      
      log.push(`Inbox found. Operating for user ID: ${userId}`);
      
      const allEvents = [];
      const beginTimestamp = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

      for (const [region, host] of Object.entries(MAILGUN_API_HOSTS)) {
        log.push(`Querying Mailgun '${region.toUpperCase()}' region for "accepted" events...`);
        try {
          const mailgun = new Mailgun(formData);
          const mg = mailgun.client({ username: 'api', key: apiKey, host });
          
          const events = await mg.events.get(domain, {
            event: "accepted",
            limit: 300,
            begin: beginTimestamp,
            recipient: emailAddress,
          });

          if (events?.items?.length > 0) {
            log.push(`Found ${events.items.length} "accepted" event(s) in ${region.toUpperCase()}.`);
            allEvents.push(...events.items);
          } else {
            log.push(`No "accepted" events found in ${region.toUpperCase()}.`);
          }
        } catch (hostError: any) {
          if (hostError.status !== 401) { 
            logger.warn(`Error querying Mailgun region '${region.toUpperCase()}'.`, { region, message: hostError.message });
            log.push(`[ERROR] Failed to query ${region.toUpperCase()} region: ${hostError.message}`);
          } else {
            log.push(`[INFO] Key not valid for ${region.toUpperCase()} region, skipping.`);
          }
        }
      }
      
      if (allEvents.length === 0) {
        log.push("No new 'accepted' mail events found across all regions. Action complete.");
        return { success: true, log };
      }

      log.push(`Total "accepted" events found: ${allEvents.length}. Processing each email.`);
      const batch = firestore.batch();
      const emailsCollectionRef = firestore.collection(`inboxes/${inboxId}/emails`);
      let newEmailsFound = 0;

      for (const event of allEvents) {
        const messageId = event.message?.headers?.['message-id'];
        if (!messageId) {
            log.push(`[WARN] Skipping event with no message-id: ${event.id}`);
            continue;
        }

        const existingEmailRef = emailsCollectionRef.doc(messageId);
        const existingEmailSnap = await existingEmailRef.get();
        if (existingEmailSnap.exists) {
            log.push(`[INFO] Skipping email ${messageId}: already exists in database.`);
            continue;
        }
        
        const storageUrl = event.storage?.url;
        if (!storageUrl) {
            log.push(`[WARN] Skipping event ${event.id} - no storage URL present.`);
            continue; 
        }
        
        log.push(`[INFO] Fetching content for message ${messageId}...`);
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(storageUrl, {
            headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` }
        });

        if (!response.ok) {
            log.push(`[ERROR] Failed to fetch content from Mailgun storage for message ${messageId}. Status: ${response.status}. This likely means your Mailgun API Key is invalid or lacks permissions.`);
            continue; 
        } else {
            log.push(`[SUCCESS] Fetched content for message ${messageId}.`);
        }
        
        const message = await response.json() as any;
        const cleanHtml = DOMPurify.sanitize(message["body-html"] || message["stripped-html"] || "");
        
        const emailData: Omit<Email, 'id'> = {
            inboxId,
            userId,
            recipient: emailAddress,
            senderName: message.From || "Unknown Sender",
            subject: message.Subject || "No Subject",
            receivedAt: Timestamp.fromMillis(event.timestamp * 1000),
            createdAt: Timestamp.now(),
            htmlContent: cleanHtml,
            textContent: message["stripped-text"] || message["body-plain"] || "No text content.",
            rawContent: JSON.stringify(message, null, 2),
            attachments: message.attachments || [],
            read: false,
        };
        
        batch.set(existingEmailRef, emailData);
        newEmailsFound++;
        log.push(`[INFO] Prepared email ${messageId} for batch write.`);
      }
      
      if (newEmailsFound > 0) {
        await batch.commit();
        log.push(`SUCCESS: Batch write of ${newEmailsFound} new email(s) committed to Firestore.`);
      } else {
        log.push("No new, unique emails needed to be written to the database.");
      }
      
      return { success: true, log };

    } catch (error: any) {
      logger.error('An unexpected error occurred in the function.', { errorMessage: error.message, stack: error.stack });
      log.push(`[FATAL_ERROR]: ${error.message}`);
      return { success: false, error: error.message || 'An unknown server error occurred.', log };
    }
  }
);


/**
 * Triggered when a user is deleted from Firebase Authentication.
 * Cleans up all associated user data from Firestore.
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
    const userId = user.uid;
    logger.log(`User deleted: ${userId}. Cleaning up Firestore data...`);

    const db = getFirestore();
    const batch = db.batch();

    const userDocRef = db.doc(`users/${userId}`);
    batch.delete(userDocRef);
    logger.log(`Scheduled deletion for user document: /users/${userId}`);

    const inboxesQuery = db.collection("inboxes").where("userId", "==", userId);
    const inboxSnaps = await inboxesQuery.get();

    if (inboxSnaps.empty) {
        logger.log(`No inboxes found for user ${userId}.`);
    } else {
        logger.log(`Found ${inboxSnaps.size} inbox(es) to delete for user ${userId}.`);
        for (const doc of inboxSnaps.docs) {
            batch.delete(doc.ref);
            const emailsRef = doc.ref.collection("emails");
            const emailSnaps = await emailsRef.get();
            emailSnaps.forEach(emailDoc => batch.delete(emailDoc.ref));
        }
    }

    try {
        await batch.commit();
        logger.log(`Successfully deleted all data for user ${userId}.`);
    } catch (error) {
        logger.error(`Error deleting data for user ${userId}`, error);
    }
});

    

    

    