
'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';

interface MailgunSettings {
    apiKey: string;
    domain: string;
    enabled: boolean;
}

/**
 * Securely saves Mailgun configuration to Firestore using the Admin SDK.
 * This is a server action that can bypass client-side security rules.
 * @param settings - The Mailgun settings to save.
 */
export async function saveMailgunSettingsAction(settings: MailgunSettings) {
  const { firestore, error: adminError } = getFirebaseAdmin();

  if (adminError) {
    console.error('Error in saveMailgunSettingsAction:', adminError.message);
    return { error: adminError.message };
  }

  try {
    const settingsRef = firestore.collection('admin_settings').doc('mailgun');
    
    // Ensure enabled is true if an API key is present
    const settingsToSave = {
        ...settings,
        enabled: !!settings.apiKey,
    };

    await settingsRef.set(settingsToSave, { merge: true });

    return { success: true, message: 'Mailgun settings saved successfully.' };

  } catch (error: any) {
    console.error('Error in saveMailgunSettingsAction:', error);
    return {
      error: 'Could not save Mailgun settings to the database.',
    };
  }
}
