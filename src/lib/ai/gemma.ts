import { keyManager } from './key-manager';

export type AIResponse = {
  content: string;
  structuredData?: any;
};

export async function generateGemmaResponse(
  prompt: string,
  systemPrompt: string = 'You are AETDRIXZ AI, a high-end AI workspace.',
  stream: boolean = false,
  structured: boolean = false
) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    const apiKey = await keyManager.getKey();
    if (!apiKey) throw new Error('No active API keys available');

    try {
      const response = await fetch('https://api.gemma.cloud/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma-4-31b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          stream: stream,
          response_format: structured ? { type: 'json_object' } : undefined,
        }),
      });

      if (response.status === 429) {
        await keyManager.markCooldown(apiKey);
        retryCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      if (stream) {
        return response.body; // Return the readable stream
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Gemma API Error:', error);
      retryCount++;
      if (retryCount >= maxRetries) throw error;
    }
  }
}
