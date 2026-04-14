import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

/**
 * Validate API key at startup — fail fast
 */
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is missing');
}

/**
 * Shared Google client
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Use ONLY verified working models
 */
const FALLBACK_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
] as const;

export interface GenerateOptions {
  temperature?: number;
  timeoutMs?: number;
}

/**
 * Generate text with strict fallback handling
 */
export async function generateWithFallback(
  prompt: string,
  opts?: GenerateOptions
) {
  let lastError: unknown = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[gemini] Trying ${modelName}...`);

      // Timeout control
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 8000);

      const result = await generateText({
        model: google(modelName),
        prompt,
        temperature: opts?.temperature ?? 0.7,
        maxRetries: 0, // avoid double retry logic
        abortSignal: controller.signal,
      });

      clearTimeout(timeout);

      console.log(`[gemini] Success: ${modelName}`);
      return result;

    } catch (e: any) {
      const status = e.statusCode;

      console.warn(`[gemini] Failed: ${modelName}`, {
        status,
        message: e.message,
      });

      lastError = e;

      // Skip invalid model
      if (status === 404) continue;

      // Retryable → try next model
      if (status === 429 || status === 503) continue;

      // Abort / timeout case
      if (e.name === 'AbortError') continue;

      // Everything else = real bug → stop immediately
      throw e;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}