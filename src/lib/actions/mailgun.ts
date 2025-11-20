
'use server';

// This file is now deprecated and its logic has been moved to a Firebase Cloud Function.
// The client now calls the 'fetchEmails' Cloud Function directly.
// This server action is no longer used and can be safely removed in the future.

export async function fetchEmailsWithCredentialsAction(
    emailAddress: string,
    inboxId: string,
    ownerToken?: string
): Promise<{ success: boolean; error?: string; log: string[] }> {
    const log = ["[DEPRECATED] This server action is no longer in use."];
    console.warn("fetchEmailsWithCredentialsAction is deprecated. The client should call the 'fetchEmails' Firebase Cloud Function directly.");
    return {
        success: false,
        error: "This server action is deprecated. Please update the client to use the 'fetchEmails' Firebase Cloud Function.",
        log
    };
}

    