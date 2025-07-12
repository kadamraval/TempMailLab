'use server';

/**
 * @fileOverview Genkit flow for generating a random, temporary email address.
 *
 * - generateTempEmail - A function that generates a random temporary email address.
 * - GenerateTempEmailInput - The input type for the generateTempEmail function.
 * - GenerateTempEmailOutput - The return type for the generateTempEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fetch from 'node-fetch';

const GenerateTempEmailInputSchema = z.object({
});
export type GenerateTempEmailInput = z.infer<typeof GenerateTempEmailInputSchema>;

const GenerateTempEmailOutputSchema = z.object({
  email: z.string().describe('The generated temporary email address.'),
});
export type GenerateTempEmailOutput = z.infer<typeof GenerateTempEmailOutputSchema>;

export async function generateTempEmail(input: GenerateTempEmailInput): Promise<GenerateTempEmailOutput> {
  return generateTempEmailFlow(input);
}

const generateTempEmailFlow = ai.defineFlow(
  {
    name: 'generateTempEmailFlow',
    inputSchema: GenerateTempEmailInputSchema,
    outputSchema: GenerateTempEmailOutputSchema,
  },
  async () => {
    try {
      const response = await fetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
      if (!response.ok) {
        throw new Error(`1secmail API failed with status: ${response.status}`);
      }
      const data = await response.json() as string[];
      if (!data || data.length === 0) {
        throw new Error('No email address returned from 1secmail API');
      }
      const email = data[0];
      return { email };
    } catch (error) {
      console.error('Error generating temporary email:', error);
      // Fallback to a random string if API fails
      const randomString = Math.random().toString(36).substring(2, 10);
      const email = `${randomString}@1secmail.com`;
      return { email };
    }
  }
);
