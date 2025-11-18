
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/firebase/server-init';

interface MailgunSettings {
    enabled: boolean;
    apiKey: string;
    domain: string;
}

/**
 * Saves Mailgun settings to Firestore.
 * @param settings The Mailgun settings to save.
 * @returns An object indicating success or an error message.
 */
export async function saveMailgunSettingsAction(settings: MailgunSettings) {
    try {
        const firestore = await getAdminFirestore();
        // The document ID is 'mailgun' for this specific setting.
        const settingsRef = firestore.doc("admin_settings/mailgun");

        // Automatically enable if API key and domain are provided
        const finalSettings = {
            ...settings,
            enabled: !!(settings.apiKey && settings.domain)
        };

        await settingsRef.set(finalSettings, { merge: true });
        
        // Revalidate paths that might depend on these settings
        revalidatePath('/admin/settings/integrations/mailgun');
        revalidatePath('/');
        
        return { success: true };

    } catch (error: any) {
        console.error("[SETTINGS_ACTION_ERROR]", error);
        return { error: error.message || 'An unknown server error occurred.' };
    }
}
