
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotBackground } from '@/components/dot-background';
import { getFirebaseAdmin } from '@/firebase/index.server';

/**
 * Ensures that a "free-default" plan document exists in the Firestore database.
 * If it doesn't exist, it creates one with a specific ID ('free-default').
 * This is a system-critical plan that serves as a fallback.
 * Uses set with merge to be idempotent and resilient.
 */
async function seedFreePlan() {
  const { firestore, error: adminError } = getFirebaseAdmin();
  
  if (adminError) {
    console.warn("Skipping free plan seed due to server config error:", adminError.message);
    return;
  }

  try {
    const freePlanRef = firestore.collection('plans').doc('free-default');
    
    const freePlanData = {
        name: 'Free',
        price: 0,
        cycle: "monthly",
        status: "active",
        features: {
            maxInboxes: 1,
            inboxLifetime: 10, // 10 minutes
            customPrefix: false,
            customDomains: 0,
            allowPremiumDomains: false,
            inboxLocking: false,
            emailForwarding: false,
            allowAttachments: true,
            maxAttachmentSize: 5, // 5 MB
            sourceCodeView: false,
            linkSanitization: true,
            exportEmails: false,
            maxEmailsPerInbox: 25,
            totalStorageQuota: 0, // Unlimited
            searchableHistory: false,
            dataRetentionDays: 0, // No retention
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
        // This will only be set if the document is created for the first time.
        // It won't be overwritten on subsequent merges if it already exists.
        createdAt: new Date().toISOString(),
    };

    // Use set with merge: true. This creates the doc if it doesn't exist,
    // or harmlessly merges if it does. This is an idempotent operation,
    // which is perfect for seeding.
    await freePlanRef.set(freePlanData, { merge: true });

  } catch (error: any) {
    console.error('CRITICAL: Error seeding free plan:', error);
  }
}


export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Ensure the free plan exists before rendering the page.
  await seedFreePlan();

  return (
    <div className="relative flex flex-col min-h-screen">
       <DotBackground />
        <Header />
        <main className="flex-grow z-10">
            {children}
        </main>
        <Footer />
    </div>
  );
}

    