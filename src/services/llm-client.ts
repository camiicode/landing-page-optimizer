import { GoogleGenerativeAI } from '@google/generative-ai';

const defaultApiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
if (!defaultApiKey) {
  console.warn('[llm-client] GEMINI_API_KEY not set — AI analysis will be unavailable');
}

const defaultGenAI = defaultApiKey ? new GoogleGenerativeAI(defaultApiKey) : null;
const defaultModel = defaultGenAI?.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeWithGemini(
  systemPrompt: string,
  userPrompt: string,
  apiKey?: string
): Promise<string | null> {
  const key = apiKey || defaultApiKey;
  if (!key) return null;

  const model = apiKey
    ? new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.0-flash' })
    : defaultModel;

  if (!model) return null;

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  return result.response.text();
}
