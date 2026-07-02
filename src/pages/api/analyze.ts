import type { APIRoute } from 'astro';
import { extractContent } from '../../services/extractor';
import { analyzeWithAI } from '../../services/analyzer';
import type { ExtractedData } from '../../services/extractor';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('[analyze] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, '| import.meta.env:', !!(import.meta as any).env?.GEMINI_API_KEY);

    const body = await request.json();
    const { url, data, apiKey } = body as { url?: string; data?: ExtractedData; apiKey?: string };

    if (!data && !url) {
      return json({ success: false, error: 'Either extracted data or URL is required' }, 400);
    }

    const pageData: ExtractedData = data ?? await extractContent(url!);

    const analysis = await analyzeWithAI(pageData, apiKey);
    console.log('[analyze] analysis result:', analysis ? 'present' : 'null');

    return json({ success: true, analysis });
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        analysis: null,
      },
      500
    );
  }
};
