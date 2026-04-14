/**
 * Shared PDF parsing utility.
 * Uses dynamic import for pdf-parse to avoid ESM bundling issues in Next.js.
 *
 * Previously duplicated in:
 *   - app/api/upload-resume/route.ts
 *   - app/api/process-resume/route.ts
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

/**
 * Truncate content to avoid Gemini API input size limits.
 * @param content - Raw text content
 * @param maxChars - Maximum characters (default 8000)
 */
export function truncateForAI(content: string, maxChars = 8000): string {
  if (content.length <= maxChars) return content;
  return content.substring(0, maxChars) + '\n\n[Content truncated due to length]';
}
