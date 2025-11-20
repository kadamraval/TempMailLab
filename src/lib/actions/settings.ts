
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

interface MailgunSettings {
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
        const firestore = getAdminFirestore();
        const settingsRef = firestore.doc("admin_settings/mailgun");

        // Automatically enable if API key and domain are provided.
        const finalSettings = {
            ...settings,
            enabled: !!(settings.apiKey && settings.domain)
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
