
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

interface MailgunSettings {
    signingKey: string;
    apiKey: string;
    domain: string;
}

/**
 * Saves Mailgun settings to Firestore.
 * @param settings The Mailgun settings to save.
 * @returns An object indicating success or an error message.
 */
export async function saveMailgunSettingsAction(settings: MailgunSettings) {
    console.log("Attempting to save Mailgun settings...");
    try {
        const firestore = getAdminFirestore();
        const settingsRef = firestore.doc("admin_settings/mailgun");

        // Automatically enable if all keys and domain are provided.
        const finalSettings = {
            ...settings,
            enabled: !!(settings.signingKey && settings.apiKey && settings.domain)
        };
        
        console.log("Saving the following settings to Firestore:", finalSettings);
        await settingsRef.set(finalSettings, { merge: true });
        console.log("Successfully saved settings to Firestore.");
        
        revalidatePath('/admin/settings/integrations/mailgun');
        revalidatePath('/');
        
        return { success: true };

    } catch (error: any) {
        console.error("[SAVE_SETTINGS_ACTION_ERROR]", {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return { error: error.message || 'An unknown server error occurred.' };
    }
}
