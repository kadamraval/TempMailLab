'use server';

/**
 * @fileOverview Genkit flow for fetching emails from a temporary inbox.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';
import type { Email } from '@/types';

const GetInboxInputSchema = z.object({
    login: z.string().describe('The login part of the email address.'),
    domain: z.string().describe('The domain part of the email address.'),
});
export type GetInboxInput = z.infer<typeof GetInboxInputSchema>;

const GetInboxOutputSchema = z.object({
  inbox: z.array(z.object({
    id: z.number(),
    from: z.string(),
    subject: z.string(),
    date: z.string(),
  })).describe('The list of emails in the inbox.'),
});
export type GetInboxOutput = z.infer<typeof GetInboxOutputSchema>;

export async function getInbox(input: GetInboxInput): Promise<GetInboxOutput> {
  return getInboxFlow(input);
}

const getInboxFlow = ai.defineFlow(
  {
    name: 'getInboxFlow',
    inputSchema: GetInboxInputSchema,
    outputSchema: GetInboxOutputSchema,
  },
  async ({ login, domain }) => {
    try {
      const response = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
      if (!response.ok) {
        // It's normal for it to 404 if the inbox doesn't exist yet, so don't throw.
        if (response.status === 404) {
            return { inbox: [] };
        }
        throw new Error(`1secmail API failed with status: ${response.status}`);
      }
      const data = await response.json() as Email[];
      return { inbox: data || [] };
    } catch (error) {
      console.error('Error fetching inbox:', error);
      return { inbox: [] };
    }
  }
);
