
'use server';

import { revalidatePath } from 'next/cache';
import { initializeFirebase } from '@/firebase/server-init';
import { doc, setDoc } from "firebase/firestore";

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
        const { firestore } = initializeFirebase();
        
        // The document ID is 'mailgun' for this specific setting.
        const settingsRef = doc(firestore, "admin_settings", "mailgun");

        // Automatically enable if API key and domain are provided
        const finalSettings = {
            ...settings,
            enabled: !!(settings.apiKey && settings.domain)
        };

        await setDoc(settingsRef, finalSettings, { merge: true });
        
        // Revalidate paths that might depend on these settings
        revalidatePath('/admin/settings/integrations/mailgun');
        revalidatePath('/');
        
        return { success: true };

    } catch (error: any) {
        console.error("[SETTINGS_ACTION_ERROR]", error);
        return { error: error.message || 'An unknown server error occurred.' };
    }
}
