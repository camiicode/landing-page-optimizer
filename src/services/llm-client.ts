import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Gemini (proveedor opcional, usado cuando el usuario provee su propia API key) ──

const defaultGeminiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';

const defaultGenAI = defaultGeminiKey ? new GoogleGenerativeAI(defaultGeminiKey) : null;
const defaultModel = defaultGenAI?.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeWithGemini(
  systemPrompt: string,
  userPrompt: string,
  apiKey?: string
): Promise<string | null> {
  const key = apiKey || defaultGeminiKey;
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

// ── Groq (proveedor gratuito por defecto, vía API compatible con OpenAI) ──

const defaultGroqKey = process.env.GROQ_API_KEY || (import.meta as any).env?.GROQ_API_KEY || '';
if (!defaultGroqKey) {
  console.warn('[llm-client] GROQ_API_KEY not set — default AI analysis will be unavailable');
}

export async function analyzeWithGroq(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  if (!defaultGroqKey) return null;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${defaultGroqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[groq] Error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[groq] Request failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
