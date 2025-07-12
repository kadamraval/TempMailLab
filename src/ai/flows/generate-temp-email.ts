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

const GenerateTempEmailInputSchema = z.object({
  prefix: z.string().optional().describe('Optional prefix for the email address.'),
  domain: z.string().optional().describe('Optional domain for the email address. Defaults to mail.tm if not specified.'),
});
export type GenerateTempEmailInput = z.infer<typeof GenerateTempEmailInputSchema>;

const GenerateTempEmailOutputSchema = z.object({
  email: z.string().describe('The generated temporary email address.'),
});
export type GenerateTempEmailOutput = z.infer<typeof GenerateTempEmailOutputSchema>;

export async function generateTempEmail(input: GenerateTempEmailInput): Promise<GenerateTempEmailOutput> {
  return generateTempEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTempEmailPrompt',
  input: {schema: GenerateTempEmailInputSchema},
  output: {schema: GenerateTempEmailOutputSchema},
  prompt: `Generate a random temporary email address.

  {{#if prefix}}
  Use the prefix: {{{prefix}}}
  {{/if}}

  {{#if domain}}
  Use the domain: {{{domain}}}
  {{else}}
  Use the domain: mail.tm
  {{/if}}
  `,
});

const generateTempEmailFlow = ai.defineFlow(
  {
    name: 'generateTempEmailFlow',
    inputSchema: GenerateTempEmailInputSchema,
    outputSchema: GenerateTempEmailOutputSchema,
  },
  async input => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const domain = input.domain || 'mail.tm';
    const prefix = input.prefix || randomString;
    const email = `${prefix}@${domain}`;

    return {email};
  }
);
