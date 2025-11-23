
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
 * Verifies Mailgun API credentials and domain settings.
 * @param settings The Mailgun settings to verify.
 * @returns A result object indicating success or failure with a specific message.
 */
export async function verifyMailgunSettingsAction(settings: MailgunSettings): Promise<{ success: boolean; message: string; }> {
    if (!settings.apiKey || !settings.domain) {
        return { success: false, message: 'API Key and Domain are required.' };
    }

    try {
        const clientOptions: ClientOptions = {
            username: 'api',
            key: settings.apiKey,
            url: settings.region === 'EU' ? MAILGUN_API_ENDPOINTS.EU : MAILGUN_API_ENDPOINTS.US,
        };
        
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client(clientOptions);
        
        // Verify credentials by fetching domain info. This is a low-cost and reliable check.
        await mg.domains.get(settings.domain);

        return {
            success: true,
            message: 'Connection successful! Your API Key and Domain are valid.'
        };

    } catch (error: any) {
        console.error("[verifyMailgunSettingsAction Error]", error);
        if (error.status === 401) {
            return { 
                success: false, 
                message: 'Authentication failed. Please double-check your API Key and ensure the selected Region is correct for your Mailgun account.' 
            };
        }
         if (error.status === 404) {
            return { 
                success: false, 
                message: `The domain '${settings.domain}' was not found in your Mailgun account for the selected region.`
            };
        }
        return { 
            success: false, 
            message: error.message || 'An unknown error occurred while trying to connect to Mailgun.' 
        };
    }
}

    