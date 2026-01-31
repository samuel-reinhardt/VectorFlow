'use server';

/**
 * @fileOverview AI-powered node layout suggestion flow.
 *
 * This file exports:
 * - `suggestNodeLayout`: A function that takes a graph of nodes and suggests an optimized layout.
 * - `SuggestNodeLayoutInput`: The input type for the `suggestNodeLayout` function.
 * - `SuggestNodeLayoutOutput`: The output type for the `suggestNodeLayout` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define Zod schemas for input and output types
const SuggestNodeLayoutInputSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().describe('Unique identifier for the node.'),
      label: z.string().describe('The label or title of the node.'),
      // You might add more node properties here as needed
    })
  ).describe('An array of node objects representing the graph.'),
  edges: z.array(
    z.object({
      source: z.string().describe('The ID of the source node.'),
      target: z.string().describe('The ID of the target node.'),
    })
  ).describe('An array of edge objects representing the connections between nodes.'),
});
export type SuggestNodeLayoutInput = z.infer<typeof SuggestNodeLayoutInputSchema>;

const SuggestNodeLayoutOutputSchema = z.array(
  z.object({
    id: z.string().describe('The ID of the node.'),
    x: z.number().describe('The suggested x-coordinate for the node.'),
    y: z.number().describe('The suggested y-coordinate for the node.'),
  })
).describe('An array of node layout suggestions with x and y coordinates.');
export type SuggestNodeLayoutOutput = z.infer<typeof SuggestNodeLayoutOutputSchema>;

// Exported function to trigger the flow
export async function suggestNodeLayout(input: SuggestNodeLayoutInput): Promise<SuggestNodeLayoutOutput> {
  return suggestNodeLayoutFlow(input);
}

// Define the prompt
const suggestNodeLayoutPrompt = ai.definePrompt({
  name: 'suggestNodeLayoutPrompt',
  input: {schema: SuggestNodeLayoutInputSchema},
  output: {schema: SuggestNodeLayoutOutputSchema},
  prompt: `You are an AI graph layout assistant. Given a graph represented by nodes and edges, suggest an optimal layout for the nodes.

Consider the following factors when determining the layout:
- Readability: Minimize edge crossings and ensure nodes are not overlapping.
- Visual Balance: Distribute nodes evenly across the canvas.
- Connection Density: Place highly connected nodes closer together.

Nodes:
{{#each nodes}}
- id: {{id}}, label: {{label}}
{{/each}}

Edges:
{{#each edges}}
- source: {{source}}, target: {{target}}
{{/each}}

Suggest the layout by providing x and y coordinates for each node. The coordinates should be within a reasonable range (e.g., 0-1000) to fit on a standard canvas. Respond in JSON format.

Output:
`,
});

// Define the Genkit flow
const suggestNodeLayoutFlow = ai.defineFlow(
  {
    name: 'suggestNodeLayoutFlow',
    inputSchema: SuggestNodeLayoutInputSchema,
    outputSchema: SuggestNodeLayoutOutputSchema,
  },
  async input => {
    const {output} = await suggestNodeLayoutPrompt(input);
    return output!;
  }
);


