'use server';

import { suggestNodeLayout, SuggestNodeLayoutInput, SuggestNodeLayoutOutput } from '@/ai/flows/suggest-node-layout';

export async function arrangeLayoutAction(input: SuggestNodeLayoutInput): Promise<{ success: true, data: SuggestNodeLayoutOutput } | { success: false, error: string }> {
  try {
    const suggestedLayout = await suggestNodeLayout(input);
    return { success: true, data: suggestedLayout };
  } catch (error) {
    console.error('Failed to arrange layout:', error);
    // In a real app, you might want to log this error to a monitoring service
    return { success: false, error: 'Could not get layout suggestion from AI.' };
  }
}
