import type { APIRoute } from 'astro';
import { extractContent } from '../../services/extractor';
import { calculateScore } from '../../services/scoring';

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
    const body = await request.json();
    let { url } = body;

    if (!url || typeof url !== 'string') {
      return json({ success: false, error: 'URL inválida o no proporcionada' }, 400);
    }

    url = url.trim();

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      new URL(url);
    } catch {
      return json({ success: false, error: 'Formato de URL inválido' }, 400);
    }

    const data = await extractContent(url);
    const score = calculateScore(data);

    return json({ success: true, data, score });
  } catch (error) {
    console.error('Error en /api/extract:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      500
    );
  }
};
