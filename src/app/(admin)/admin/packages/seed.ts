
'use server';

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';

export async function seedDefaultPlan() {
  try {
    const { firestore } = initializeFirebase();
    const defaultPlanRef = doc(firestore, 'plans', 'default');
    const docSnap = await getDoc(defaultPlanRef);

    if (docSnap.exists()) {
      // Default plan already exists, do nothing.
      return { success: true, message: 'Default plan already exists.' };
    }

    // Default plan does not exist, so we create it.
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
        createdAt: serverTimestamp(),
    };

    await setDoc(defaultPlanRef, defaultPlanData);
    console.log('Successfully seeded the default plan.');
    return { success: true, message: 'Default plan seeded successfully.' };

  } catch (error: any) {
    console.error('Error seeding default plan:', error);
    // Don't re-throw, just log and return error state
    return {
      success: false,
      error: 'Could not seed the default plan.',
    };
  }
}
