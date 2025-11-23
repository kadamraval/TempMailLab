'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Email } from '@/types';

async function getProviderSettings() {
    const firestore = getAdminFirestore();
    const emailSettingsDoc = await firestore.doc('admin_settings/email').get();
    const activeProvider = emailSettingsDoc.exists && emailSettingsDoc.data()?.provider ? emailSettingsDoc.data()?.provider : 'inbound-new';
    
    const settingsDoc = await firestore.doc(`admin_settings/${activeProvider}`).get();
    if (!settingsDoc.exists || !settingsDoc.data()?.enabled) {
        throw new Error(`The '${activeProvider}' email provider is not configured or enabled in your admin settings.`);
    }
    const settings = settingsDoc.data();
    if (!settings?.apiKey) {
        throw new Error(`API key for '${activeProvider}' is missing from settings.`);
    }
    return { provider: activeProvider, settings };
}

// This function is a placeholder because inbound.new's primary mechanism is webhooks.
// A manual fetch API is not part of their standard offering for disposable emails.
// This will return a helpful message to the user explaining the situation.
async function fetchFromInboundNew(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    // In a real scenario with a provider that supports polling, you would make an API call here.
    // e.g., const response = await fetch(`https://api.inbound.new/v1/emails?to=${emailAddress}`, { headers: { 'X-Api-Key': '...'} });
    // For now, we immediately return a message that guides the user.
    return { 
        success: true, 
        message: "inbound.new works via real-time webhooks. When your app is live, emails will appear automatically. The refresh button is primarily for other providers like Mailgun." 
    };
}


export async function fetchAndStoreEmailsAction(emailAddress: string, inboxId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string; }> {
    try {
        const { provider, settings } = await getProviderSettings();

        // The logic for fetching emails would differ based on the provider.
        // For inbound.new, a manual fetch is not the primary method.
        // A real implementation would have different logic here.
        if (provider === 'inbound-new') {
            return await fetchFromInboundNew(emailAddress, inboxId, userId);
        }
        
        // If we were to implement Mailgun fetching, it would go here.
        // For now, we can throw an error if another provider is configured but not implemented.
        if (provider === 'mailgun') {
             return { success: false, error: "Mailgun manual fetch is not implemented in this version. Please configure it if needed." };
        }

        throw new Error(`Unsupported email provider configured: ${provider}`);

    } catch (error: any) {
        console.error("[fetchAndStoreEmailsAction Error]", error);
        return { success: false, error: error.message || 'An unknown error occurred while fetching emails.' };
    }
}
