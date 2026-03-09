'use server';
/**
 * @fileOverview An AI agent that summarizes support ticket descriptions.
 *
 * - summarizeTicket - A function that summarizes a support ticket description.
 * - TicketSummaryInput - The input type for the summarizeTicket function.
 * - TicketSummaryOutput - The return type for the summarizeTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TicketSummaryInputSchema = z.object({
  description: z.string().describe('The detailed description of the support ticket.'),
});
export type TicketSummaryInput = z.infer<typeof TicketSummaryInputSchema>;

const TicketSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the ticket description.'),
});
export type TicketSummaryOutput = z.infer<typeof TicketSummaryOutputSchema>;

export async function summarizeTicket(input: TicketSummaryInput): Promise<TicketSummaryOutput> {
  return automatedTicketSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ticketSummaryPrompt',
  input: {schema: TicketSummaryInputSchema},
  output: {schema: TicketSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing support ticket descriptions.
Your goal is to extract the core issue and provide a concise, easy-to-understand summary.

Ticket Description: {{{description}}}

Provide a concise summary of the ticket description. Focus on the main problem or request.`,
});

const automatedTicketSummaryFlow = ai.defineFlow(
  {
    name: 'automatedTicketSummaryFlow',
    inputSchema: TicketSummaryInputSchema,
    outputSchema: TicketSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
