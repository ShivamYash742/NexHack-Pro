import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing');
}

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const FALLBACK_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
] as const;

export interface GenerateOptions {
  temperature?: number;
  timeoutMs?: number;
}

export async function generateWithGroq(
  prompt: string,
  opts?: GenerateOptions
) {
  let lastError: unknown = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[groq] Trying ${modelName}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 8000);

      const result = await generateText({
        model: groq(modelName),
        prompt,
        temperature: opts?.temperature ?? 0.7,
        maxRetries: 0,
        abortSignal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[groq] Success: ${modelName}`);
      return result;

    } catch (e: any) {
      console.warn(`[groq] Failed: ${modelName}`, {
        status: e.statusCode,
        message: e.message,
      });

      lastError = e;

      if (e.statusCode === 404) continue;
      if (e.statusCode === 429 || e.statusCode === 503) continue;
      if (e.name === 'AbortError') continue;

      throw e;
    }
  }

  throw lastError || new Error('All Groq models failed');
}
