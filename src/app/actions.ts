"use server";

import { generateTempEmail } from "@/ai/flows/generate-temp-email";
import { getInbox } from "@/ai/flows/get-inbox";
import { getSingleEmail } from "@/ai/flows/get-single-email";

export async function generateTempEmailAction() {
  try {
    const result = await generateTempEmail({});
    return result.email;
  } catch (error) {
    console.error("Error generating temporary email:", error);
    return null;
  }
}

export async function getInboxAction(login: string, domain: string) {
    try {
        const result = await getInbox({ login, domain });
        return result.inbox;
    } catch (error) {
        console.error("Error fetching inbox:", error);
        return [];
    }
}

export async function getSingleEmailAction(login: string, domain: string, id: number) {
    try {
        const result = await getSingleEmail({ login, domain, id });
        return result.email;
    } catch (error)        {
        console.error("Error fetching email:", error);
        return null;
    }
}
