'use server';

/**
 * @fileOverview Genkit flow for fetching a single email's content from mail.tm.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const GetSingleEmailInputSchema = z.object({
    token: z.string().describe('The authentication token for mail.tm API.'),
    id: z.string().describe('The ID of the email to fetch.'),
});
export type GetSingleEmailInput = z.infer<typeof GetSingleEmailInputSchema>;


const GetSingleEmailOutputSchema = z.object({
  email: z.object({
    id: z.string(),
    from: z.object({ address: z.string(), name: z.string() }),
    to: z.array(z.object({ address: z.string(), name: z.string() })),
    subject: z.string(),
    seen: z.boolean(),
    createdAt: z.string(),
    text: z.string().optional(),
    html: z.array(z.string()).optional(),
  }).describe('The full email content.'),
});
export type GetSingleEmailOutput = z.infer<typeof GetSingleEmailOutputSchema>;

export async function getSingleEmail(input: GetSingleEmailInput): Promise<GetSingleEmailOutput> {
  return getSingleEmailFlow(input);
}

const getSingleEmailFlow = ai.defineFlow(
  {
    name: 'getSingleEmailFlow',
    inputSchema: GetSingleEmailInputSchema,
    outputSchema: GetSingleEmailOutputSchema,
  },
  async ({ token, id }) => {
    try {
      const response = await fetch(`https://api.mail.tm/messages/${id}`, {
         headers: {
            'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`mail.tm API failed with status: ${response.status}`);
      }
      const data = await response.json();
      
      return { 
          email: {
              id: data.id,
              from: data.from,
              to: data.to,
              subject: data.subject,
              seen: data.seen,
              createdAt: data.createdAt,
              text: data.text,
              html: data.html,
          }
       };
    } catch (error) {
      console.error('Error fetching single email:', error);
      throw error;
    }
  }
);
