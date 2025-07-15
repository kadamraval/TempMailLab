"use server";

import { createMailTmAccount } from "@/ai/flows/create-mail-tm-account";
import { getInbox } from "@/ai/flows/get-inbox";
import { getSingleEmail } from "@/ai/flows/get-single-email";
import type { MailTmAccount } from "@/types";
import { firestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

export async function logInboxToFirestoreAction(
    { id, email, countdown }: { id: string, email: string, countdown: number }
) {
  if (!firestore) {
    console.log("Firestore not configured. Skipping inbox log.");
    return;
  }
  
  try {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + countdown * 1000);
    const domain = email.split('@')[1];

    await firestore.collection('inboxes').doc(id).set({
        email: email,
        userId: 'anonymous', // For now, all are anonymous
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: expiresAt,
        emailCount: 0, // This could be updated later with another function
        domain: domain,
    });
  } catch (error) {
    console.error("Error logging inbox to Firestore:", error);
    // We don't throw here, as it's a non-critical background task
  }
}
