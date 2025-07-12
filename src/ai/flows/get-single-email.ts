'use server';

/**
 * @fileOverview Genkit flow for fetching a single email's content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const GetSingleEmailInputSchema = z.object({
    login: z.string().describe('The login part of the email address.'),
    domain: z.string().describe('The domain part of the email address.'),
    id: z.number().describe('The ID of the email to fetch.'),
});
export type GetSingleEmailInput = z.infer<typeof GetSingleEmailInputSchema>;


const GetSingleEmailOutputSchema = z.object({
  email: z.object({
    id: z.number(),
    from: z.string(),
    subject: z.string(),
    date: z.string(),
    body: z.string().optional(),
    htmlBody: z.string().optional(),
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
  async ({ login, domain, id }) => {
    try {
      const response = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
      if (!response.ok) {
        throw new Error(`1secmail API failed with status: ${response.status}`);
      }
      const data = await response.json() as {id: number, from: string, subject: string, date: string, htmlBody?: string, body?: string};

      return { 
          email: {
              id: data.id,
              from: data.from,
              subject: data.subject,
              date: data.date,
              body: data.body,
              htmlBody: data.htmlBody,
          }
       };
    } catch (error) {
      console.error('Error fetching single email:', error);
      throw error;
    }
  }
);
