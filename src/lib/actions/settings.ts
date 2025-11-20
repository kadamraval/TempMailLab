
'use server';

import Mailgun from 'mailgun.js';
import formData from 'form-data';
import type { ClientOptions } from 'mailgun.js';

interface MailgunSettings {
    apiKey: string;
    domain: string;
    region: 'US' | 'EU';
}

const MAILGUN_API_ENDPOINTS = {
    US: 'https://api.mailgun.net',
    EU: 'https://api.eu.mailgun.net'
};

/**
 * Verifies Mailgun API credentials by making a test API call.
 * @param settings The Mailgun settings to verify.
 * @returns A result object indicating success or failure.
 */
export async function verifyMailgunSettingsAction(settings: MailgunSettings): Promise<{ success: boolean; error?: string; }> {
    if (!settings.apiKey || !settings.domain) {
        return { success: false, error: 'API Key and Domain are required.' };
    }

    try {
        const clientOptions: ClientOptions = {
            username: 'api',
            key: settings.apiKey,
            url: settings.region === 'EU' ? MAILGUN_API_ENDPOINTS.EU : MAILGUN_API_ENDPOINTS.US,
        };
        
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client(clientOptions);
        
        // Make a simple, low-cost API call to verify credentials.
        // Fetching events with a limit of 1 is a good way to test.
        await mg.events.get(settings.domain, { limit: 1 });

        return { success: true };

    } catch (error: any) {
        console.error("[verifyMailgunSettingsAction Error]", error);
        
        // Provide specific feedback for authentication errors.
        if (error.status === 401) {
            return { 
                success: false, 
                error: 'Authentication failed. Please double-check your API Key and ensure the selected Region is correct for your Mailgun account.' 
            };
        }

        return { 
            success: false, 
            error: error.message || 'An unknown error occurred while trying to connect to Mailgun.' 
        };
    }
}
