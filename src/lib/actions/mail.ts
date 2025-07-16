// @/lib/actions/mail.ts
"use server";

import type { MailTmAccount, Email } from "@/types";

const API_BASE = "https://api.mail.tm";

// Generates a random string for the email address
const generateRandomString = (length: number) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Fetches available domains from mail.tm
const getAvailableDomain = async (): Promise<string | null> => {
    try {
        const response = await fetch(`${API_BASE}/domains`);
        if (!response.ok) {
            console.error("Failed to fetch domains:", response.statusText);
            return null;
        }
        const domains = await response.json();
        // Get the first domain from the list
        return domains['hydra:member'][0]?.domain || null;
    } catch (error) {
        console.error("Error fetching domains:", error);
        return null;
    }
}


export async function createMailTmAccountAction(): Promise<MailTmAccount | null> {
  try {
    const domain = await getAvailableDomain();
    if (!domain) {
        throw new Error("No available domains found.");
    }

    const address = `${generateRandomString(10)}@${domain}`;
    const password = generateRandomString(12);

    // Create the account
    const createResponse = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    if (!createResponse.ok) {
       const errorBody = await createResponse.json();
       console.error("Failed to create account:", errorBody);
       throw new Error(errorBody['hydra:description'] || "Failed to create account");
    }

    const accountData = await createResponse.json();
    
    // Get the auth token
    const tokenResponse = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error("Failed to get token:", errorBody);
        throw new Error(errorBody['hydra:description'] || "Failed to get auth token");
    }

    const tokenData = await tokenResponse.json();

    return {
      id: accountData.id,
      email: address,
      token: tokenData.token,
    };
  } catch (error) {
    console.error("Error in createMailTmAccountAction:", error);
    return null;
  }
}

export async function getInboxAction(token: string): Promise<Email[]> {
    if (!token) return [];

    try {
        const response = await fetch(`${API_BASE}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Failed to fetch inbox:", response.statusText);
            return [];
        }

        const messages = await response.json();
        
        return messages['hydra:member'].map((msg: any) => ({
            id: msg.id,
            from: msg.from.address,
            subject: msg.subject,
            date: msg.createdAt,
            read: msg.seen,
        }));

    } catch (error) {
        console.error("Error fetching inbox:", error);
        return [];
    }
}

export async function getSingleEmailAction(token: string, messageId: string): Promise<Email | null> {
    if (!token || !messageId) return null;

    try {
        const response = await fetch(`${API_BASE}/messages/${messageId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Failed to fetch single email:", response.statusText);
            return null;
        }

        const msg = await response.json();
        
        return {
            id: msg.id,
            from: msg.from.address,
            subject: msg.subject,
            date: msg.createdAt,
            body: msg.text,
            htmlBody: msg.html?.[0], // mail.tm returns html as an array
            read: msg.seen,
        };
    } catch (error) {
        console.error("Error fetching single email:", error);
        return null;
    }
}
