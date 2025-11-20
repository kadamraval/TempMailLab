
'use server';

// This file is now deprecated and its logic has been moved to a Firebase Cloud Function.
// The client now calls the 'fetchEmails' Cloud Function directly.
// This server action is no longer used and can be safely removed in the future.

export async function fetchAndStoreEmailsAction(
    emailAddress: string,
    inboxId: string,
    userId: string
): Promise<{ success: boolean; error?: string; log: string[], message?: string }> {
    const log = ["[DEPRECATED] This server action is no longer in use."];
    console.warn("fetchAndStoreEmailsAction is deprecated. Emails are now processed via a Firebase Cloud Function webhook.");
    return {
        success: false,
        error: "This server action is deprecated. Please update the client to use the 'fetchEmails' Firebase Cloud Function.",
        log
    };
}
