'use client';
import { doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { Firestore } from "firebase/firestore";

/**
 * Fetches the Mailgun integration settings from a secure Firestore document.
 * These settings are configured by the admin.
 * @param firestore - The Firestore instance.
 * @returns An object containing the Mailgun API key, domain, and function name.
 * @throws Throws an error if the settings document does not exist.
 */
async function getMailgunSettings(firestore: Firestore) {
    // In a real app, this path would likely be more complex, e.g., '/configurations/integrations'
    const settingsRef = doc(firestore, "admin_settings", "mailgun");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
        throw new Error("Mailgun integration settings not found. Please configure them in the admin panel.");
    }

    const settings = settingsSnap.data();
    
    // Validate that all required fields are present
    if (!settings.apiKey || !settings.domain || !settings.cloudFunctionName) {
        throw new Error("Mailgun settings are incomplete. Please check the admin panel.");
    }
    
    return {
        apiKey: settings.apiKey,
        domain: settings.domain,
        functionName: settings.cloudFunctionName,
    };
}

/**
 * Invokes the backend Cloud Function to fetch emails for a specific inbox.
 * @param firestore - The Firestore instance.
 * @param userId - The ID of the current user.
 * @param inboxId - The ID of the inbox to fetch emails for.
 * @param emailAddress - The email address of the inbox.
 * @returns The result from the Cloud Function call.
 * @throws Throws an error if the Cloud Function call fails.
 */
export async function fetchEmails(
    firestore: Firestore,
    userId: string,
    inboxId: string,
    emailAddress: string
) {
    try {
        const { apiKey, domain, functionName } = await getMailgunSettings(firestore);

        const functions = getFunctions(); // Uses the default Firebase app instance
        const callFetchEmails = httpsCallable(functions, functionName);
        
        const result = await callFetchEmails({
            mailgunApiKey: apiKey,
            mailgunDomain: domain,
            inboxId: inboxId,
            emailAddress: emailAddress,
            // The Cloud Function will get the userId from the auth context
        });

        return result.data;
        
    } catch (error: any) {
        console.error("Error invoking fetchEmails Cloud Function:", error);
        // Re-throw a more user-friendly error
        if (error.code === 'functions/not-found') {
            throw new Error(`The specified Cloud Function '${functionName || ''}' was not found. Please check the name in the admin settings.`);
        }
        throw new Error(error.message || "An unexpected error occurred while fetching emails.");
    }
}
