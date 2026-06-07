import { apiKeyRotation } from "./key-rotation";

export interface GemmaMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GemmaGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

const GEMMA_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function getGemmaModel(): string {
  return process.env.GEMMA_MODEL ?? "gemma-3-27b-it";
}

function toGemmaMessages(
  messages: { role: string; content: string }[]
): GemmaMessage[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

export async function* streamGemmaCompletion(
  messages: { role: string; content: string }[],
  config: GemmaGenerationConfig = {},
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const model = getGemmaModel();
  const gemmaMessages = toGemmaMessages(messages);

  const systemInstruction = systemPrompt
    ? { parts: [{ text: systemPrompt }] }
    : messages.find((m) => m.role === "system")
      ? { parts: [{ text: messages.find((m) => m.role === "system")!.content }] }
      : undefined;

  let lastError: Error | null = null;
  const maxAttempts = apiKeyRotation.getKeyCount() || 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = apiKeyRotation.getActiveKey();
    if (!apiKey) {
      throw new Error(
        "No Gemma API keys configured. Set GEMMA_API_KEY_1 in environment variables."
      );
    }

    const url = `${GEMMA_API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: gemmaMessages,
          systemInstruction,
          generationConfig: {
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: config.maxOutputTokens ?? 8192,
            topP: config.topP ?? 0.95,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        if (apiKeyRotation.isQuotaError(response.status, body)) {
          apiKeyRotation.markKeyFailed(apiKey, response.status);
          lastError = new Error(`Gemma API rate limit: ${response.status}`);
          continue;
        }
        throw new Error(`Gemma API error ${response.status}: ${body}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const text =
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) yield text;
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
      return;
    } catch (err) {
      apiKeyRotation.markKeyFailed(apiKey);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("All Gemma API keys exhausted");
}

export async function generateGemmaCompletion(
  messages: { role: string; content: string }[],
  config: GemmaGenerationConfig = {},
  systemPrompt?: string
): Promise<string> {
  let result = "";
  for await (const chunk of streamGemmaCompletion(messages, config, systemPrompt)) {
    result += chunk;
  }
  return result;
}
