
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

interface MailgunSettings {
    enabled: boolean;
    apiKey: string;
    domain: string;
    region: string;
}

/**
 * Saves Mailgun settings to Firestore.
 * @param settings The Mailgun settings to save.
 * @returns An object indicating success or an error message.
 */
export async function saveMailgunSettingsAction(settings: MailgunSettings) {
    try {
        const firestore = await getAdminFirestore();
        const settingsRef = firestore.doc("admin_settings/mailgun");

        // Automatically enable if API key, domain, and region are provided
        const finalSettings = {
            ...settings,
            enabled: !!(settings.apiKey && settings.domain && settings.region)
        };

        await settingsRef.set(finalSettings, { merge: true });
        
        revalidatePath('/admin/settings/integrations/mailgun');
        revalidatePath('/');
        
        return { success: true };

    } catch (error: any) {
        console.error("[SETTINGS_ACTION_ERROR]", error);
        return { error: error.message || 'An unknown server error occurred.' };
    }
}
