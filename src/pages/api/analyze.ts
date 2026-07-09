import type { APIRoute } from 'astro';
import { extractContent } from '../../services/extractor';
import { analyzeWithAI } from '../../services/analyzer';
import type { ExtractedData } from '../../services/extractor';
import { checkRateLimit } from '../../utils/rate-limit';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
  return {
    'X-RateLimit-Limit': '3',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetSeconds.toString(),
    ...(result.allowed ? {} : { 'Retry-After': result.resetSeconds.toString() }),
  };
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const POST: APIRoute = async ({ request }) => {
  try {
    const visitorId = request.headers.get('x-visitor-id');
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    const limit = checkRateLimit(visitorId, clientIp);
    const rlHeaders = rateLimitHeaders(limit);

    if (!limit.allowed) {
      return json(
        { success: false, error: 'Daily analysis limit reached (3/3). Come back tomorrow or use your own API key.' },
        429,
        rlHeaders,
      );
    }

    console.log('[analyze] GROQ_API_KEY present:', !!process.env.GROQ_API_KEY, '| GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

    const body = await request.json();
    const { url, data, apiKey } = body as { url?: string; data?: ExtractedData; apiKey?: string };

    if (!data && !url) {
      return json({ success: false, error: 'Either extracted data or URL is required' }, 400, rlHeaders);
    }

    const pageData: ExtractedData = data ?? await extractContent(url!);

    const analysis = await analyzeWithAI(pageData, apiKey);
    console.log('[analyze] analysis result:', analysis ? 'present' : 'null');

    if (!analysis) {
      const error = !process.env.GROQ_API_KEY
        ? 'GROQ_API_KEY is not configured on the server. Add it in Render Dashboard → Environment.'
        : 'Groq API error — check quota (1000 req/day for llama-3.3-70b) or server logs.';
      return json({ success: true, analysis: null, error }, 200, rlHeaders);
    }

    return json({ success: true, analysis }, 200, rlHeaders);
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
