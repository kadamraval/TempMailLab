'use server';

import { initializeFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';

export async function seedDefaultPlan() {
  try {
    const { firestore } = await initializeFirebaseAdmin();
    const defaultPlanRef = firestore.collection('plans').doc('default');
    const docSnap = await defaultPlanRef.get();

    if (docSnap.exists) {
      return { success: true, message: 'Default plan already exists.' };
    }

    const defaultPlanData = {
        name: "Default",
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
    console.log('Successfully seeded the default plan.');
    return { success: true, message: 'Default plan seeded successfully.' };

  } catch (error: any) {
    console.error('Error seeding default plan:', error);
    if (error.message.includes("not configured")) {
        return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'Could not seed the default plan.',
    };
  }
}
