
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';


/**
 * Ensures that a "Free" plan document exists in the Firestore database.
 * If it doesn't exist, it creates one with a specific ID ('free').
 * This is a system-critical plan that serves as a fallback.
 */
export async function seedFreePlan() {
  const { firestore, error: adminError } = getFirebaseAdmin();
  
  if (adminError) {
    // Log the configuration warning but don't throw an error,
    // allowing the app to run without admin features.
    console.warn("Skipping free plan seed:", adminError.message);
    return { success: false, error: adminError.message };
  }

  try {
    // The document ID 'free' is the unique identifier for this system plan.
    const freePlanRef = firestore.collection('plans').doc('free');
    const docSnap = await freePlanRef.get();

    if (docSnap.exists) {
      // If the plan exists, ensure its name is "Free".
      if (docSnap.data()?.name !== 'Free') {
        await freePlanRef.update({ name: 'Free' });
        console.log(`Corrected system plan name to "Free".`);
      }
      return { success: true, message: 'Free plan already exists.' };
    }

    // If the document does not exist, create it with the correct "Free" name.
    const freePlanData = {
        name: 'Free',
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

    await freePlanRef.set(freePlanData);
    console.log(`Successfully seeded the "Free" plan.`);
    return { success: true, message: 'Free plan seeded successfully.' };

  } catch (error: any) {
    console.error('Error seeding free plan:', error);
    return {
      success: false,
      error: 'Could not seed the free plan.',
    };
  }
}


/**
 * Deletes a plan document from Firestore using the Admin SDK.
 * @param planId The ID of the plan document to delete.
 */
export async function deletePlanAction(planId: string) {
  if (!planId) {
    return { error: 'Plan ID is required.' };
  }
  
  if (planId === 'free') {
    return { error: 'The system-critical "Free" plan cannot be deleted.' };
  }

  const { firestore, error: adminError } = getFirebaseAdmin();
  if (adminError) {
    console.error('Error in deletePlanAction:', adminError.message);
    return { error: adminError.message };
  }

  try {
    const planRef = firestore.collection('plans').doc(planId);
    
    await planRef.delete();

    // Revalidate the path to ensure the UI updates after the deletion.
    revalidatePath('/admin/packages');

    return { success: true, message: 'Plan deleted successfully.' };
  } catch (error: any) {
    console.error('Error in deletePlanAction:', error);
    return {
      error: 'Could not delete the plan from the database.',
    };
  }
}
