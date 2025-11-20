'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';

interface MailgunSettings {
    signingKey: string;
    apiKey: string;
    domain: string;
}

/**
 * @deprecated This server action is deprecated and should not be used. Settings are now saved client-side.
 */
export async function saveMailgunSettingsAction(settings: MailgunSettings) {
    console.error("[DEPRECATED] saveMailgunSettingsAction was called but is no longer supported.");
    return { error: 'This function is deprecated. Please update the client to save settings directly to Firestore.' };
}
