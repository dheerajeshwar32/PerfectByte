import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'compress_to_target',
        description: 'Compress a single image to a specific target file size in kilobytes. Use this whenever the user wants a smaller file, mentions a size limit (KB/MB), or names a use case with a known size limit (e.g. "for WhatsApp", "for a passport photo", "under 100kb").',
        parameters: {
          type: 'object',
          properties: {
            targetKB: {
              type: 'number',
              description: 'The target file size in kilobytes. If the user gives no number and no recognizable use case, use a sensible default of 200.',
            },
          },
          required: ['targetKB'],
        },
      },
      {
        name: 'compress_pdf_to_target',
        description: 'Compresses a PDF document to an exact target size in KB.',
        parameters: {
          type: 'object',
          properties: {
            targetKB: {
              type: 'number',
              description: 'The exact target file size in KB',
            },
          },
          required: ['targetKB'],
        },
      },
      {
        name: 'bulk_compress',
        description: 'Compress multiple images at once using a general-purpose quality setting, for when the user has uploaded more than one image and just wants them all smaller without naming a specific target size.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'remove_blank_pages',
        description: 'Analyzes an uploaded PDF document and removes any blank pages. Use this when the user mentions cleaning a PDF, removing empty pages, or deleting blank pages.',
        parameters: {
          type: 'object',
          properties: {},
        },
      }
    ],
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ text: 'Method not allowed' });
  }

  // 1. Safe Rate Limiter (Prevents Global Scope Crashing)
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      // Explicitly pass credentials instead of relying on the strict fromEnv()
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
      });
      
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      const { success } = await ratelimit.limit(ip as string);
      
      if (!success) {
        return res.status(429).json({ text: "You're moving too fast! Please wait a minute before sending another request." });
      }
    } else {
      console.warn("Upstash credentials missing. Rate limiting bypassed to keep API alive.");
    }
  } catch (error) {
    console.warn('Rate limiter encountered an issue, allowing request through:', error);
  }

  // 2. Gemini API Execution
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: 'Error: The server is missing the Gemini API key.' });
  }

  const { message, fileCount } = (req.body ?? {}) as { message?: string; fileCount?: number };
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ text: 'A message is required.' });
  }

  const contextNote = fileCount && fileCount > 1 ? ` (The user has uploaded ${fileCount} files.)` : '';

  try {
    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: message + contextNote }] }],
        tools: TOOLS,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(200).json({ text: 'The AI service returned an error. Check the server logs.' });
    }

    const data = await geminiResponse.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionCallPart = parts.find((part: any) => part.functionCall);

    if (functionCallPart?.functionCall) {
      return res.status(200).json({
        type: 'function_call',
        name: functionCallPart.functionCall.name,
        args: functionCallPart.functionCall.args ?? {},
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textPart = parts.find((part: any) => typeof part.text === 'string');
    return res.status(200).json({
      type: 'text',
      text: textPart?.text ?? "I'm not sure how to help with that yet.",
    });
  } catch (error) {
    console.error('Assistant handler error:', error);
    return res.status(200).json({ text: 'Something went wrong talking to the AI.' });
  }
}