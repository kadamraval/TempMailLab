'use server';

/**
 * @fileOverview Genkit flow for fetching emails from a mail.tm inbox.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';
import type { Email } from '@/types';

const GetInboxInputSchema = z.object({
    token: z.string().describe('The authentication token for mail.tm API.'),
});
export type GetInboxInput = z.infer<typeof GetInboxInputSchema>;

const GetInboxOutputSchema = z.object({
  inbox: z.array(z.object({
    id: z.string(),
    from: z.object({
        address: z.string(),
        name: z.string(),
    }),
    subject: z.string(),
    intro: z.string(),
    seen: z.boolean(),
    createdAt: z.string(),
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
  async ({ token }) => {
    try {
      const response = await fetch('https://api.mail.tm/messages', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`mail.tm API failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      // The API returns an object with a 'hydra:member' key containing the emails
      const inbox = (data['hydra:member'] || []).map((email: any) => ({
          id: email.id,
          from: email.from,
          subject: email.subject,
          intro: email.intro,
          seen: email.seen,
          createdAt: email.createdAt,
      }));
      
      return { inbox: inbox };
    } catch (error) {
      console.error('Error fetching inbox:', error);
      return { inbox: [] };
    }
  }
);
