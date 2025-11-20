
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
import { getFirestore } from 'firebase-admin/firestore';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

// Initialize Firebase Admin SDK.
// It will automatically use service account credentials in a Google Cloud environment.
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

async function getMailgunCredentials() {
  try {
    const settingsRef = firestore.doc('admin_settings/mailgun');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      throw new Error(
        'Mailgun settings document not found in Firestore. Please configure it in the admin panel.'
      );
    }

    const settings = settingsSnap.data();
    if (!settings?.apiKey || !settings.domain) {
      throw new Error(
        'Mailgun API Key or Domain is missing from settings. Please check the configuration.'
      );
    }

    return { apiKey: settings.apiKey, domain: settings.domain };
  } catch (error: any) {
    logger.error('FATAL: Could not get Mailgun credentials.', {
      errorMessage: error.message,
    });
    throw error;
  }
}

export const fetchEmails = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { emailAddress, inboxId } = request.data as FetchEmailsRequest;
    logger.info(`Function called for ${emailAddress}`);

    if (!emailAddress || !inboxId) {
      logger.error('Function failed: Missing email address or inbox ID.');
      return {
        success: false,
        error: 'Email address and Inbox ID are required.',
      };
    }

    try {
      const { apiKey, domain } = await getMailgunCredentials();
      const inboxRef = firestore.doc(`inboxes/${inboxId}`);
      const inboxSnap = await inboxRef.get();
      if (!inboxSnap.exists) {
        throw new Error(`Inbox with ID ${inboxId} not found.`);
      }
      const userId = inboxSnap.data()?.userId;
      if (!userId) {
        throw new Error(`Could not retrieve user ID for inbox ${inboxId}.`);
      }

      const allEvents = [];
      const beginTimestamp = Math.floor(
        (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
      );

      for (const [region, host] of Object.entries(MAILGUN_API_HOSTS)) {
        logger.info(`Querying Mailgun '${region.toUpperCase()}' region...`);
        try {
          const mailgun = new Mailgun(formData);
          const mg = mailgun.client({ username: 'api', key: apiKey, host });

          const events = await mg.events.get(domain, {
            event: 'stored',
            limit: 300,
            begin: beginTimestamp,
            recipient: emailAddress,
          });

          if (events?.items?.length > 0) {
            allEvents.push(...events.items);
          }
        } catch (hostError: any) {
          if (hostError.status !== 401) {
            logger.warn(
              `Could not query Mailgun region '${region.toUpperCase()}'.`,
              { region, message: hostError.message }
            );
          }
        }
      }

      if (allEvents.length === 0) {
        logger.info('No new mail events found.');
        return { success: true, count: 0 };
      }

      const batch = firestore.batch();
      const emailsCollectionRef = firestore.collection(
        `inboxes/${inboxId}/emails`
      );
      let newEmailsFound = 0;

      for (const event of allEvents) {
        const messageId = event.message?.headers?.['message-id'];
        if (!messageId) continue;

        const existingEmailRef = emailsCollectionRef.doc(messageId);
        const existingEmailSnap = await existingEmailRef.get();
        if (existingEmailSnap.exists) continue;

        const storageUrl = event.storage?.url;
        if (!storageUrl) continue;

        const fetch = (await import('node-fetch')).default;
        const response = await fetch(storageUrl, {
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString(
              'base64'
            )}`,
          },
        });

        if (!response.ok) {
          logger.error(
            `Failed to fetch content from Mailgun for message ${messageId}. Status: ${response.status}. This may be an API key or permissions issue.`
          );
          continue; // Skip this email but try others
        }

        const message = (await response.json()) as any;

        const emailData = {
          inboxId,
          userId: userId,
          recipient: emailAddress,
          senderName: message.From || 'Unknown Sender',
          subject: message.Subject || 'No Subject',
          receivedAt: new Date(event.timestamp * 1000),
          htmlContent: message['body-html'] || message['stripped-html'] || '',
          textContent:
            message['stripped-text'] || message['body-plain'] || '',
          rawContent: JSON.stringify(message, null, 2),
          attachments: message.attachments || [],
          read: false,
        };

        batch.set(existingEmailRef, emailData);
        newEmailsFound++;
      }

      if (newEmailsFound > 0) {
        await batch.commit();
        logger.info(`Successfully saved ${newEmailsFound} new email(s).`);
      }

      return { success: true, count: newEmailsFound };
    } catch (error: any) {
      logger.error('An unexpected error occurred in the function.', {
        errorMessage: error.message,
        stack: error.stack,
      });
      return { success: false, error: error.message };
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

    // 1. Delete user document from `/users`
    const userDocRef = db.doc(`users/${userId}`);
    batch.delete(userDocRef);
    logger.log(`Scheduled deletion for user document: /users/${userId}`);

    // 2. Find and delete all inboxes (and their sub-collections) owned by the user
    const inboxesQuery = db.collection("inboxes").where("userId", "==", userId);
    const inboxSnaps = await inboxesQuery.get();

    if (inboxSnaps.empty) {
        logger.log(`No inboxes found for user ${userId}.`);
    } else {
        logger.log(`Found ${inboxSnaps.size} inbox(es) to delete for user ${userId}.`);
        for (const doc of inboxSnaps.docs) {
            // Delete the inbox document itself
            batch.delete(doc.ref);
            // Recursively delete the 'emails' sub-collection within each inbox
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
