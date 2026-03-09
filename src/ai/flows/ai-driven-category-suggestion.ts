'use server';
/**
 * @fileOverview An AI agent that suggests the most relevant issue category for a support ticket.
 *
 * - aiDrivenCategorySuggestion - A function that handles the AI-driven category suggestion process.
 * - AIDrivenCategorySuggestionInput - The input type for the aiDrivenCategorySuggestion function.
 * - AIDrivenCategorySuggestionOutput - The return type for the aiDrivenCategorySuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIDrivenCategorySuggestionInputSchema = z.object({
  ticketDescription: z
    .string()
    .describe('The description of the support ticket.'),
});
export type AIDrivenCategorySuggestionInput = z.infer<
  typeof AIDrivenCategorySuggestionInputSchema
>;

const AIDrivenCategorySuggestionOutputSchema = z.object({
  suggestedCategory: z
    .enum([
      'Technical Support',
      'Billing Inquiry',
      'Account Management',
      'General Inquiry',
      'Bug Report',
      'Feature Request'
    ])
    .describe('The AI-suggested category for the ticket.'),
});
export type AIDrivenCategorySuggestionOutput = z.infer<
  typeof AIDrivenCategorySuggestionOutputSchema
>;

export async function aiDrivenCategorySuggestion(
  input: AIDrivenCategorySuggestionInput
): Promise<AIDrivenCategorySuggestionOutput> {
  return aiDrivenCategorySuggestionFlow(input);
}

const aiDrivenCategorySuggestionPrompt = ai.definePrompt({
  name: 'aiDrivenCategorySuggestionPrompt',
  input: {schema: AIDrivenCategorySuggestionInputSchema},
  output: {schema: AIDrivenCategorySuggestionOutputSchema},
  prompt: `You are an AI assistant specialized in categorizing support tickets.

Based on the provided ticket description, suggest the most relevant issue category from the following list:
- Technical Support
- Billing Inquiry
- Account Management
- General Inquiry
- Bug Report
- Feature Request

Your response MUST be a JSON object with a single field 'suggestedCategory' containing only the category name from the list. Do not include any other text or explanations.

Ticket Description: {{{ticketDescription}}}`,
});

const aiDrivenCategorySuggestionFlow = ai.defineFlow(
  {
    name: 'aiDrivenCategorySuggestionFlow',
    inputSchema: AIDrivenCategorySuggestionInputSchema,
    outputSchema: AIDrivenCategorySuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await aiDrivenCategorySuggestionPrompt(input);
    return output!;
  }
);
