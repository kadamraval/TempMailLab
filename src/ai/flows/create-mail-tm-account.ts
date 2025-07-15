
'use server';

/**
 * @fileOverview Genkit flow for creating a new account on mail.tm
 * and generating a temporary email address.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const CreateMailTmAccountInputSchema = z.object({});
export type CreateMailTmAccountInput = z.infer<typeof CreateMailTmAccountInputSchema>;

const CreateMailTmAccountOutputSchema = z.object({
  id: z.string().describe('The account ID from mail.tm'),
  email: z.string().describe('The generated temporary email address.'),
  token: z.string().describe('The JWT token for authentication.'),
});
export type CreateMailTmAccountOutput = z.infer<typeof CreateMailTmAccountOutputSchema>;

export async function createMailTmAccount(input: CreateMailTmAccountInput): Promise<CreateMailTmAccountOutput> {
  return createMailTmAccountFlow(input);
}

const createMailTmAccountFlow = ai.defineFlow(
  {
    name: 'createMailTmAccountFlow',
    inputSchema: CreateMailTmAccountInputSchema,
    outputSchema: CreateMailTmAccountOutputSchema,
  },
  async () => {
    try {
      const commonHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      };

      // 1. Get available domains
      const domainResponse = await fetch('https://api.mail.tm/domains', {
        headers: { 'User-Agent': commonHeaders['User-Agent'] }
      });

      if (!domainResponse.ok) {
        throw new Error(`mail.tm domain API failed with status: ${domainResponse.status}`);
      }
      const domains = await domainResponse.json();
      const domain = domains['hydra:member'][0].domain;

      // 2. Create an account
      const address = `${Math.random().toString(36).substring(7)}@${domain}`;
      const password = Math.random().toString(36).substring(7);

      const accountResponse = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({
          address,
          password,
        }),
      });

      if (!accountResponse.ok) {
        throw new Error(`mail.tm account creation failed with status: ${accountResponse.statusText}`);
      }
      const accountData = await accountResponse.json();
      const accountId = accountData.id;

      // 3. Get the auth token
      const tokenResponse = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({
          address,
          password,
        }),
      });
      if (!tokenResponse.ok) {
        throw new Error(`mail.tm token generation failed with status: ${tokenResponse.statusText}`);
      }
      const tokenData = await tokenResponse.json();

      return {
        id: accountId,
        email: address,
        token: tokenData.token,
      };

    } catch (error) {
      console.error('Error creating mail.tm account:', error);
      throw error;
    }
  }
);
