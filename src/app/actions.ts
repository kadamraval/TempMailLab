"use server";

import { createMailTmAccount } from "@/ai/flows/create-mail-tm-account";
import { getInbox } from "@/ai/flows/get-inbox";
import { getSingleEmail } from "@/ai/flows/get-single-email";
import type { MailTmAccount } from "@/types";

export async function createMailTmAccountAction(): Promise<MailTmAccount | null> {
  try {
    const result = await createMailTmAccount({});
    return result;
  } catch (error) {
    console.error("Error creating mail.tm account:", error);
    return null;
  }
}

export async function getInboxAction(token: string) {
    try {
        const result = await getInbox({ token });
        // The API returns emails with from/subject etc. We need to adapt it to our Email type
        return result.inbox.map(m => ({
            id: m.id,
            from: m.from.address,
            subject: m.subject,
            date: m.createdAt,
            read: m.seen,
        }));
    } catch (error) {
        console.error("Error fetching inbox:", error);
        return [];
    }
}

export async function getSingleEmailAction(token: string, id: string) {
    try {
        const result = await getSingleEmail({ token, id });
        if (!result.email) return null;
        
        return {
            id: result.email.id,
            from: result.email.from.address,
            subject: result.email.subject,
            date: result.email.createdAt,
            body: result.email.text,
            htmlBody: result.email.html ? result.email.html.join('') : undefined,
            read: result.email.seen,
        }
    } catch (error)        {
        console.error("Error fetching email:", error);
        return null;
    }
}
