import type { VercelRequest, VercelResponse } from '@vercel/node';

// Using the stable generateContent API for function calling rather than the
// newer Interactions API — Google's own docs currently recommend
// generateContent for production function calling, since the Interactions
// API's function calling is still in beta.
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'compress_to_target',
        description:
          'Compress a single image to a specific target file size in kilobytes. Use this whenever the user wants a smaller file, mentions a size limit (KB/MB), or names a use case with a known size limit (e.g. "for WhatsApp", "for a passport photo", "under 100kb").',
        parameters: {
          type: 'object',
          properties: {
            targetKB: {
              type: 'number',
              description:
                'The target file size in kilobytes. If the user gives no number and no recognizable use case, use a sensible default of 200.',
            },
          },
          required: ['targetKB'],
        },
      },
      {
        name: 'bulk_compress',
        description:
          'Compress multiple images at once using a general-purpose quality setting, for when the user has uploaded more than one image and just wants them all smaller without naming a specific target size.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    ],
  },
];

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with a Gemini API key.' });
    return;
  }

  const { message, fileCount } = (req.body ?? {}) as { message?: string; fileCount?: number };

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'A message is required.' });
    return;
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
      res.status(502).json({ error: 'The AI service returned an error.' });
      return;
    }

    const data = await geminiResponse.json();
    const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];

    const functionCallPart = parts.find((part) => part.functionCall);

    if (functionCallPart?.functionCall) {
      res.status(200).json({
        type: 'function_call',
        name: functionCallPart.functionCall.name,
        args: functionCallPart.functionCall.args ?? {},
      });
      return;
    }

    const textPart = parts.find((part) => typeof part.text === 'string');
    res.status(200).json({
      type: 'text',
      text: textPart?.text ?? "I'm not sure how to help with that yet.",
    });
  } catch (error) {
    console.error('Assistant handler error:', error);
    res.status(500).json({ error: 'Something went wrong talking to the AI.' });
  }
}
