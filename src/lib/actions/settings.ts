
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
 * Verifies Mailgun API credentials and domain settings, including checking for storage.
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
        
        // 1. Verify credentials by fetching domain info. This is a low-cost and reliable check.
        let domainSettings;
        try {
             domainSettings = await mg.domains.get(settings.domain);
        } catch (error: any) {
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
            throw error; // Re-throw other unexpected errors
        }

        // 2. Check if storage is enabled for the domain.
        // When storage is on, web_scheme is 'http' or 'https'. If off, it's null.
        if (domainSettings.domain?.web_scheme) {
            return { 
                success: true, 
                message: 'Connection successful! Storage is enabled for this domain.' 
            };
        } else {
            return { 
                success: false, 
                message: "Verification Failed: 'Storage' is not enabled for this domain in your Mailgun dashboard. Please find the domain in Mailgun, go to its settings, and enable the 'Store and Notify' feature." 
            };
        }

    } catch (error: any) {
        console.error("[verifyMailgunSettingsAction Error]", error);
        return { 
            success: false, 
            message: error.message || 'An unknown error occurred while trying to connect to Mailgun.' 
        };
    }
}
