
'use server';

import { initializeFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';

export async function seedDefaultPlan() {
  try {
    const { firestore } = await initializeFirebaseAdmin();
    // The document ID 'default' is the unique identifier for this system plan.
    const defaultPlanRef = firestore.collection('plans').doc('default');
    const docSnap = await defaultPlanRef.get();

    if (docSnap.exists) {
      // If the plan exists, ensure its name is "Default".
      // This corrects any previous state where it might have been named "Free".
      if (docSnap.data()?.name !== 'Default') {
        await defaultPlanRef.update({ name: 'Default' });
        console.log('Corrected system plan name to "Default".');
        return { success: true, message: 'Default plan name corrected.' };
      }
      return { success: true, message: 'Default plan already exists and is correct.' };
    }

    // If the document does not exist, create it with the correct "Default" name.
    const defaultPlanData = {
        name: "Default", // Explicitly set the name to "Default".
        price: 0,
        cycle: "monthly",
        status: "active",
        features: {
            maxInboxes: 1,
            inboxLifetime: 10,
            customPrefix: false,
            customDomains: 0,
            allowPremiumDomains: false,
            inboxLocking: false,
            emailForwarding: false,
            allowAttachments: true,
            maxAttachmentSize: 5,
            sourceCodeView: false,
            linkSanitization: true,
            exportEmails: false,
            maxEmailsPerInbox: 25,
            totalStorageQuota: 0,
            searchableHistory: false,
            dataRetentionDays: 0,
            passwordProtection: false,
            twoFactorAuth: false,
            spamFilteringLevel: "basic",
            virusScanning: false,
            auditLogs: false,
            apiAccess: false,
            apiRateLimit: 0,
            webhooks: false,
            prioritySupport: false,
            dedicatedAccountManager: false,
            noAds: false,
            browserExtension: false,
            teamMembers: 0,
            customBranding: false,
            usageAnalytics: false,
        },
        createdAt: FieldValue.serverTimestamp(),
    };

    await defaultPlanRef.set(defaultPlanData);
    console.log('Successfully seeded the "Default" plan.');
    return { success: true, message: 'Default plan seeded successfully.' };

  } catch (error: any) {
    if (error.message.includes("not configured")) {
        console.warn("Server-side Firebase not configured, skipping default plan seed.");
        return { success: false, error: error.message };
    }
    console.error('Error seeding default plan:', error);
    return {
      success: false,
      error: 'Could not seed the default plan.',
    };
  }
}
